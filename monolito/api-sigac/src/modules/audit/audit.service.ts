import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registro de auditoría (documento: usuario, timestamp, acción, estado antes/después).
   * Usar `tx` para incluirlo en la misma transacción que el cambio de negocio.
   */
  async record(params: {
    tx?: Prisma.TransactionClient;
    userId: string;
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    payloadBefore?: Prisma.InputJsonValue | null;
    payloadAfter?: Prisma.InputJsonValue | null;
  }): Promise<void> {
    const db = params.tx ?? this.prisma;
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        payloadBefore:
          params.payloadBefore === null || params.payloadBefore === undefined
            ? undefined
            : params.payloadBefore,
        payloadAfter:
          params.payloadAfter === null || params.payloadAfter === undefined
            ? undefined
            : params.payloadAfter,
      },
    });
  }
}
