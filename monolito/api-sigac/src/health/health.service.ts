import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type HealthStatusPayload = {
  status: string;
  database: string;
  dbCheckMs: number;
};

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStatus(): Promise<HealthStatusPayload> {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const dbCheckMs = Date.now() - started;
      return {
        status: 'ok',
        database: 'up',
        dbCheckMs,
      };
    } catch (err) {
      const dbCheckMs = Date.now() - started;
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Comprobación de base de datos fallida (${dbCheckMs}ms): ${detail}`,
      );
      throw new ServiceUnavailableException({
        status: 'degraded',
        database: 'down',
        dbCheckMs,
      });
    }
  }
}
