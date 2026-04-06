import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({
    example: 'Revisión de avances',
    description:
      'La actividad se crea en estado DRAFT (propuesta arquitectónica). Solo en DRAFT admite PATCH; confirmada, cancelada o finalizada no.',
  })
  @IsString()
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: '2026-03-20' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'activityDate debe ser YYYY-MM-DD',
  })
  activityDate: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime debe ser HH:mm en 24h',
  })
  startTime: string;

  @ApiProperty({ example: '11:30' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime debe ser HH:mm en 24h',
  })
  endTime: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  minimumQuorum: number;

  @ApiPropertyOptional({
    description: 'IDs de usuarios participantes',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  participantUserIds?: string[];
}
