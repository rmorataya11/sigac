import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AvailabilityUserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;
}

export class AvailabilityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: String, format: 'date' })
  date: Date;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ type: AvailabilityUserSummaryDto })
  user?: AvailabilityUserSummaryDto;
}
