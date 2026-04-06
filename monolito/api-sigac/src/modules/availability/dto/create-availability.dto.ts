import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CreateAvailabilityDto {
  @ApiProperty({
    example: '2026-03-20',
    description: 'Fecha en formato YYYY-MM-DD',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date debe ser YYYY-MM-DD',
  })
  date: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime debe ser HH:mm en 24h',
  })
  startTime: string;

  @ApiProperty({ example: '12:30' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime debe ser HH:mm en 24h',
  })
  endTime: string;
}
