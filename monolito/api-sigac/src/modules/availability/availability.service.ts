import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Availability } from '@prisma/client';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import {
  AvailabilityRepository,
  AvailabilityWithUser,
} from './repositories/availability.repository';
import {
  isValidTimeFormat,
  isValidTimeOrder,
  parseDateOnly,
  rangesOverlap,
} from '../../common/utils/time-range.util';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
  ) {}

  async create(
    userId: string,
    dto: CreateAvailabilityDto,
  ): Promise<Availability> {
    const date = this.parseAndValidateDate(dto.date);
    this.assertValidTimes(dto.startTime, dto.endTime);
    await this.assertNoOverlap(userId, date, dto.startTime, dto.endTime, null);
    await this.assertNoOverlapWithConfirmedActivity(
      userId,
      date,
      dto.startTime,
      dto.endTime,
    );
    return this.availabilityRepository.create({
      user: { connect: { id: userId } },
      date,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });
  }

  findMine(userId: string): Promise<Availability[]> {
    return this.availabilityRepository.findByUserId(userId);
  }

  findGlobal(): Promise<AvailabilityWithUser[]> {
    return this.availabilityRepository.findAllWithUser();
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAvailabilityDto,
  ): Promise<Availability> {
    const existing = await this.availabilityRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('No puedes modificar esta disponibilidad');
    }

    const date = dto.date ? this.parseAndValidateDate(dto.date) : existing.date;
    const startTime = dto.startTime ?? existing.startTime;
    const endTime = dto.endTime ?? existing.endTime;

    this.assertValidTimes(startTime, endTime);
    await this.assertNoOverlap(userId, date, startTime, endTime, id);
    await this.assertNoOverlapWithConfirmedActivity(
      userId,
      date,
      startTime,
      endTime,
    );

    return this.availabilityRepository.update(id, {
      date,
      startTime,
      endTime,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.availabilityRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('No puedes eliminar esta disponibilidad');
    }
    await this.availabilityRepository.delete(id);
  }

  private parseAndValidateDate(yyyyMmDd: string): Date {
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

  private async assertNoOverlap(
    userId: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeId: string | null,
  ): Promise<void> {
    const sameDay = await this.availabilityRepository.findByUserIdAndDate(
      userId,
      date,
    );
    for (const row of sameDay) {
      if (excludeId && row.id === excludeId) {
        continue;
      }
      if (rangesOverlap(startTime, endTime, row.startTime, row.endTime)) {
        throw new BadRequestException(
          'El intervalo se traslapa con otra disponibilidad del mismo día',
        );
      }
    }
  }

  private async assertNoOverlapWithConfirmedActivity(
    userId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ): Promise<void> {
    const overlaps =
      await this.availabilityRepository.userOverlapsConfirmedActivitySlot(
        userId,
        date,
        startTime,
        endTime,
      );
    if (overlaps) {
      throw new BadRequestException(
        'No puedes registrar disponibilidad en un horario que se traslapa con una actividad confirmada en tu agenda',
      );
    }
  }
}
