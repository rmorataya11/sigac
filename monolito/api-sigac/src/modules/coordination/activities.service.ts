import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityStatus, AuditAction, Prisma, Role } from '@prisma/client';
import {
  intervalFullyContains,
  isValidTimeFormat,
  isValidTimeOrder,
  parseDateOnly,
  rangesOverlap,
} from '../../common/utils/time-range.util';
import { AvailabilityRepository } from '../availability/repositories/availability.repository';
import {
  ActivitiesRepository,
  ActivityWithParticipants,
} from './repositories/activities.repository';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import type { PublicUser } from '../../common/types/public-user.type';
import { AuditService } from '../audit/audit.service';
import { snapshotActivity } from '../audit/activity-audit.util';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesRepository: ActivitiesRepository,
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly auditService: AuditService,
  ) {}

  findAllForUser(user: PublicUser): Promise<ActivityWithParticipants[]> {
    if (user.role === Role.ADMIN) {
      return this.activitiesRepository.findAll();
    }
    return this.activitiesRepository.findAllForParticipantUser(user.id);
  }

  async findOneForUser(
    id: string,
    user: PublicUser,
  ): Promise<ActivityWithParticipants> {
    const activity = await this.activitiesRepository.findById(id);
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }
    if (user.role !== Role.ADMIN) {
      const participates = activity.participants.some(
        (p) => p.userId === user.id,
      );
      if (!participates) {
        throw new NotFoundException('Actividad no encontrada');
      }
    }
    return activity;
  }

  async create(
    adminUserId: string,
    dto: CreateActivityDto,
  ): Promise<ActivityWithParticipants> {
    const activityDate = this.parseDate(dto.activityDate);
    this.assertValidTimes(dto.startTime, dto.endTime);
    const participantUserIds = this.uniqueIds(dto.participantUserIds ?? []);
    await this.assertUsersExist(participantUserIds);
    if (participantUserIds.length > 0) {
      await this.assertParticipantsAvailability(
        participantUserIds,
        activityDate,
        dto.startTime,
        dto.endTime,
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const created = await this.activitiesRepository.createWithTx(tx, {
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        activityDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        minimumQuorum: dto.minimumQuorum,
        status: ActivityStatus.DRAFT,
        createdById: adminUserId,
        participantUserIds,
      });
      await this.auditService.record({
        tx,
        userId: adminUserId,
        action: AuditAction.ACTIVITY_CREATED,
        resourceType: 'Activity',
        resourceId: created.id,
        payloadBefore: null,
        payloadAfter: snapshotActivity(created),
      });
      return created;
    });
  }

  async update(
    id: string,
    actorUserId: string,
    dto: UpdateActivityDto,
  ): Promise<ActivityWithParticipants> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }
    const activity = await this.activitiesRepository.findById(id);
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }
    this.assertActivityEditableAsProposal(activity);
    const beforeSnapshot = snapshotActivity(activity);

    const mergedDate = dto.activityDate
      ? this.parseDate(dto.activityDate)
      : activity.activityDate;
    const mergedStart = dto.startTime ?? activity.startTime;
    const mergedEnd = dto.endTime ?? activity.endTime;
    this.assertValidTimes(mergedStart, mergedEnd);

    const participantUserIds =
      dto.participantUserIds !== undefined
        ? this.uniqueIds(dto.participantUserIds)
        : activity.participants.map((p) => p.userId);

    await this.assertUsersExist(participantUserIds);

    if (dto.minimumQuorum !== undefined) {
      if (dto.minimumQuorum > participantUserIds.length) {
        throw new BadRequestException(
          'El quórum mínimo no puede superar la cantidad de participantes',
        );
      }
    } else if (activity.minimumQuorum > participantUserIds.length) {
      throw new BadRequestException(
        'La cantidad de participantes no puede ser menor al quórum mínimo actual',
      );
    }

    await this.assertParticipantsAvailability(
      participantUserIds,
      mergedDate,
      mergedStart,
      mergedEnd,
    );

    const data: Prisma.ActivityUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      data.description = dto.description.trim();
    }
    if (dto.activityDate !== undefined) {
      data.activityDate = mergedDate;
    }
    if (dto.startTime !== undefined) {
      data.startTime = mergedStart;
    }
    if (dto.endTime !== undefined) {
      data.endTime = mergedEnd;
    }
    if (dto.minimumQuorum !== undefined) {
      data.minimumQuorum = dto.minimumQuorum;
    }

    const replaceParticipants =
      dto.participantUserIds !== undefined ? participantUserIds : null;

    return this.prisma.$transaction(async (tx) => {
      const updated =
        await this.activitiesRepository.updateFieldsAndReplaceParticipantsWithTx(
          tx,
          id,
          data,
          replaceParticipants,
        );
      await this.auditService.record({
        tx,
        userId: actorUserId,
        action: AuditAction.ACTIVITY_UPDATED,
        resourceType: 'Activity',
        resourceId: id,
        payloadBefore: beforeSnapshot,
        payloadAfter: snapshotActivity(updated),
      });
      return updated;
    });
  }

  async confirm(id: string, actorUserId: string): Promise<ActivityWithParticipants> {
    const activity = await this.activitiesRepository.findById(id);
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }
    if (activity.status !== ActivityStatus.DRAFT) {
      throw new BadRequestException(
        'Solo se pueden confirmar actividades en propuesta (estado DRAFT)',
      );
    }
    const participantUserIds = activity.participants.map((p) => p.userId);
    if (participantUserIds.length < activity.minimumQuorum) {
      throw new BadRequestException(
        'No se cumple el quórum mínimo de participantes',
      );
    }
    await this.assertParticipantsAvailability(
      participantUserIds,
      activity.activityDate,
      activity.startTime,
      activity.endTime,
    );
    await this.assertNoConfirmedScheduleConflict(
      participantUserIds,
      activity.activityDate,
      activity.startTime,
      activity.endTime,
      activity.id,
    );
    const beforeSnapshot = snapshotActivity(activity);
    return this.prisma.$transaction(async (tx) => {
      const updated = await this.activitiesRepository.confirmWithTx(tx, id);
      await this.auditService.record({
        tx,
        userId: actorUserId,
        action: AuditAction.ACTIVITY_CONFIRMED,
        resourceType: 'Activity',
        resourceId: id,
        payloadBefore: beforeSnapshot,
        payloadAfter: snapshotActivity(updated),
      });
      return updated;
    });
  }

  async cancel(id: string, actorUserId: string): Promise<ActivityWithParticipants> {
    const activity = await this.activitiesRepository.findById(id);
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }
    if (activity.status === ActivityStatus.CANCELLED) {
      throw new BadRequestException('La actividad ya está cancelada');
    }
    if (activity.status === ActivityStatus.FINALIZADA) {
      throw new BadRequestException(
        'No se puede cancelar una actividad finalizada',
      );
    }
    const beforeSnapshot = snapshotActivity(activity);
    return this.prisma.$transaction(async (tx) => {
      const updated =
        await this.activitiesRepository.cancelAndClearParticipantsWithTx(tx, id);
      await this.auditService.record({
        tx,
        userId: actorUserId,
        action: AuditAction.ACTIVITY_CANCELLED,
        resourceType: 'Activity',
        resourceId: id,
        payloadBefore: beforeSnapshot,
        payloadAfter: snapshotActivity(updated),
      });
      return updated;
    });
  }

  getDashboardSummary() {
    return this.activitiesRepository.getDashboardSummary();
  }

  /**
   * Documento arquitectónico: solo PROPUESTA es editable.
   * En modelo Prisma: PROPUESTA = DRAFT.
   */
  private assertActivityEditableAsProposal(activity: {
    status: ActivityStatus;
  }): void {
    if (activity.status === ActivityStatus.DRAFT) {
      return;
    }
    const estado =
      activity.status === ActivityStatus.CONFIRMED
        ? 'CONFIRMADA'
        : activity.status === ActivityStatus.CANCELLED
          ? 'CANCELADA'
          : activity.status === ActivityStatus.FINALIZADA
            ? 'FINALIZADA'
            : activity.status;
    throw new BadRequestException(
      `Solo las actividades en propuesta (estado DRAFT) pueden modificarse. Estado actual: ${estado}. Las actividades confirmadas, canceladas o finalizadas no admiten edición por API.`,
    );
  }

  private parseDate(yyyyMmDd: string): Date {
    try {
      return parseDateOnly(yyyyMmDd);
    } catch {
      throw new BadRequestException('Fecha inválida');
    }
  }

  private assertValidTimes(startTime: string, endTime: string): void {
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      throw new BadRequestException('Formato de hora inválido (use HH:mm)');
    }
    if (!isValidTimeOrder(startTime, endTime)) {
      throw new BadRequestException(
        'La hora de inicio debe ser anterior a la de fin',
      );
    }
  }

  private uniqueIds(ids: string[]): string[] {
    return [...new Set(ids)];
  }

  private async assertUsersExist(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const count = await this.activitiesRepository.countUsersByIds(ids);
    if (count !== ids.length) {
      throw new BadRequestException('Uno o más usuarios no existen');
    }
  }

  private async assertParticipantsAvailability(
    userIds: string[],
    activityDate: Date,
    startTime: string,
    endTime: string,
  ): Promise<void> {
    if (userIds.length === 0) {
      return;
    }
    const rows = await this.availabilityRepository.findByUserIdsAndDate(
      userIds,
      activityDate,
    );
    const byUser = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = byUser.get(row.userId) ?? [];
      list.push(row);
      byUser.set(row.userId, list);
    }
    for (const userId of userIds) {
      const list = byUser.get(userId) ?? [];
      const covers = list.some((a) =>
        intervalFullyContains(a.startTime, a.endTime, startTime, endTime),
      );
      if (!covers) {
        throw new BadRequestException(
          'Uno o más participantes no tienen disponibilidad que cubra el horario completo de la actividad',
        );
      }
    }
  }

  private async assertNoConfirmedScheduleConflict(
    participantUserIds: string[],
    activityDate: Date,
    startTime: string,
    endTime: string,
    excludeActivityId: string,
  ): Promise<void> {
    const others = await this.activitiesRepository.findConfirmedOnDateForUsers(
      activityDate,
      participantUserIds,
      excludeActivityId,
    );
    for (const other of others) {
      if (!rangesOverlap(startTime, endTime, other.startTime, other.endTime)) {
        continue;
      }
      const conflict = participantUserIds.some((uid) =>
        other.participants.some((p) => p.userId === uid),
      );
      if (conflict) {
        throw new ConflictException(
          'Conflicto de horario con otra actividad confirmada para uno o más participantes',
        );
      }
    }
  }
}
