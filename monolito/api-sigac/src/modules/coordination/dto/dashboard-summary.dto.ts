import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty({
    example: { DRAFT: 1, CONFIRMED: 2, CANCELLED: 0 },
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  byStatus: Record<string, number>;

  @ApiProperty({
    description: 'Actividades CONFIRMED con fecha desde hoy (UTC) en adelante',
  })
  upcomingConfirmed: number;
}
