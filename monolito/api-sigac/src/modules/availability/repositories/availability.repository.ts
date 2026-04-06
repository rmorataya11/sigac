import { Injectable } from '@nestjs/common';
import { ActivityStatus, Availability, Prisma } from '@prisma/client';
import { rangesOverlap } from '../../../common/utils/time-range.util';
import { PrismaService } from '../../../database/prisma.service';

export type AvailabilityWithUser = Availability & {
  user: { id: string; fullName: string; email: string };
};

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AvailabilityCreateInput): Promise<Availability> {
    return this.prisma.availability.create({ data });
  }

  findById(id: string): Promise<Availability | null> {
    return this.prisma.availability.findUnique({ where: { id } });
  }

  findByUserId(userId: string): Promise<Availability[]> {
    return this.prisma.availability.findMany({
      where: { userId },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  findByUserIdAndDate(userId: string, date: Date): Promise<Availability[]> {
    return this.prisma.availability.findMany({
      where: { userId, date },
    });
  }

  findByUserIdsAndDate(userIds: string[], date: Date): Promise<Availability[]> {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.prisma.availability.findMany({
      where: { userId: { in: userIds }, date },
    });
  }

  findAllWithUser(): Promise<AvailabilityWithUser[]> {
    return this.prisma.availability.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  update(
    id: string,
    data: Prisma.AvailabilityUpdateInput,
  ): Promise<Availability> {
    return this.prisma.availability.update({ where: { id }, data });
  }

  delete(id: string): Promise<Availability> {
    return this.prisma.availability.delete({ where: { id } });
  }

  /**
   * F.A.01: solape con actividad CONFIRMADA donde el usuario participa (misma fecha).
   */
  async userOverlapsConfirmedActivitySlot(
    userId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const acts = await this.prisma.activity.findMany({
      where: {
        status: ActivityStatus.CONFIRMED,
        activityDate: date,
        participants: { some: { userId } },
      },
      select: { startTime: true, endTime: true },
    });
    return acts.some((a) =>
      rangesOverlap(startTime, endTime, a.startTime, a.endTime),
    );
  }
}
