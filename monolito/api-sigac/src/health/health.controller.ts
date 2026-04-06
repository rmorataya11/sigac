import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check (incluye consulta real a la base de datos)',
  })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        database: 'up',
        dbCheckMs: 3,
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Base de datos no disponible',
    schema: {
      example: {
        status: 'degraded',
        database: 'down',
        dbCheckMs: 12,
      },
    },
  })
  getHealth() {
    return this.healthService.getStatus();
  }
}
