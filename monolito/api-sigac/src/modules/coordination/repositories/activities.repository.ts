import { Injectable } from '@nestjs/common';
import { Activity, ActivityStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const userPublic = { id: true, fullName: true, email: true } as const;

export type ActivityParticipantWithUser = {
  id: string;
  activityId: string;
  userId: string;
  user: { id: string; fullName: string; email: string };
};

export type ActivityWithParticipants = Activity & {
  participants: ActivityParticipantWithUser[];
};

@Injectable()
export class ActivitiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ActivityWithParticipants[]> {
    return this.prisma.activity.findMany({
      orderBy: [{ activityDate: 'asc' }, { startTime: 'asc' }],
      include: {
        participants: { include: { user: { select: userPublic } } },
      },
    });
  }

  findById(id: string): Promise<ActivityWithParticipants | null> {
    return this.prisma.activity.findUnique({
      where: { id },
      include: {
        participants: { include: { user: { select: userPublic } } },
      },
    });
  }

  countUsersByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return Promise.resolve(0);
    }
    return this.prisma.user.count({ where: { id: { in: ids } } });
  }

  create(data: {
    title: string;
    description?: string | null;
    activityDate: Date;
    startTime: string;
    endTime: string;
    minimumQuorum: number;
    status?: ActivityStatus;
    createdById: string;
    participantUserIds: string[];
  }): Promise<ActivityWithParticipants> {
    const { participantUserIds, createdById, ...rest } = data;
    return this.prisma.activity.create({
      data: {
        ...rest,
        createdBy: { connect: { id: createdById } },
        participants: {
          create: participantUserIds.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: { include: { user: { select: userPublic } } },
      },
    });
  }

  update(
    id: string,
    data: Prisma.ActivityUpdateInput,
  ): Promise<ActivityWithParticipants> {
    return this.prisma.activity.update({
      where: { id },
      data,
      include: {
        participants: { include: { user: { select: userPublic } } },
      },
    });
  }

  updateStatus(id: string, status: ActivityStatus): Promise<Activity> {
    return this.prisma.activity.update({
      where: { id },
      data: { status },
    });
  }

  async replaceParticipants(
    activityId: string,
    userIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.activityParticipant.deleteMany({ where: { activityId } });
      if (userIds.length > 0) {
        await tx.activityParticipant.createMany({
          data: userIds.map((userId) => ({ activityId, userId })),
        });
      }
    });
  }

  async updateFieldsAndReplaceParticipants(
    id: string,
    data: Prisma.ActivityUpdateInput,
    participantUserIds: string[] | null,
  ): Promise<ActivityWithParticipants> {
    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.activity.update({ where: { id }, data });
      }
      if (participantUserIds !== null) {
        await tx.activityParticipant.deleteMany({ where: { activityId: id } });
        if (participantUserIds.length > 0) {
          await tx.activityParticipant.createMany({
            data: participantUserIds.map((userId) => ({
              activityId: id,
              userId,
            })),
          });
        }
      }
      const full = await tx.activity.findUniqueOrThrow({
        where: { id },
        include: {
          participants: { include: { user: { select: userPublic } } },
        },
      });
      return full;
    });
  }

  findConfirmedOnDateForUsers(
    activityDate: Date,
    userIds: string[],
    excludeActivityId?: string,
  ): Promise<ActivityWithParticipants[]> {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.prisma.activity.findMany({
      where: {
        status: ActivityStatus.CONFIRMED,
        activityDate,
        id: excludeActivityId ? { not: excludeActivityId } : undefined,
        participants: { some: { userId: { in: userIds } } },
      },
      include: {
        participants: { include: { user: { select: userPublic } } },
      },
    });
  }

  async getDashboardSummary(): Promise<{
    total: number;
    byStatus: Record<ActivityStatus, number>;
    upcomingConfirmed: number;
  }> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [total, grouped, upcomingConfirmed] = await Promise.all([
      this.prisma.activity.count(),
      this.prisma.activity.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.activity.count({
        where: {
          status: ActivityStatus.CONFIRMED,
          activityDate: { gte: today },
        },
      }),
    ]);

    const byStatus: Record<ActivityStatus, number> = {
      [ActivityStatus.DRAFT]: 0,
      [ActivityStatus.CONFIRMED]: 0,
      [ActivityStatus.CANCELLED]: 0,
      [ActivityStatus.FINALIZADA]: 0,
    };
    for (const row of grouped) {
      byStatus[row.status] = row._count._all;
    }

    return { total, byStatus, upcomingConfirmed };
  }
}
