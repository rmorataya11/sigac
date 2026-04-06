import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../../common/decorators/authenticated-user.decorator';
import { Role } from '../../common/constants/prisma-enums';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { PublicUser } from '../../common/types/public-user.type';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@ApiTags('activities')
@ApiBearerAuth('JWT-auth')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('dashboard/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Resumen para panel (solo ADMIN)' })
  @ApiOkResponse({ type: DashboardSummaryDto })
  getDashboardSummary() {
    return this.activitiesService.getDashboardSummary();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Listar actividades',
    description:
      'ADMIN: todas. COLABORADOR: solo actividades en las que participa (UC-07).',
  })
  @ApiOkResponse({ description: 'Lista con participantes y usuario' })
  findAll(@AuthenticatedUser() user: PublicUser) {
    return this.activitiesService.findAllForUser(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Detalle de actividad',
    description:
      'COLABORADOR: solo si es participante; si no, 404.',
  })
  findOne(
    @Param('id') id: string,
    @AuthenticatedUser() user: PublicUser,
  ) {
    return this.activitiesService.findOneForUser(id, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Crear actividad en propuesta / DRAFT (solo ADMIN)',
    description:
      'Estado inicial: DRAFT (= propuesta). Tras confirmar o cancelar, las reglas de edición cambian según el documento arquitectónico.',
  })
  @ApiCreatedResponse({
    description: 'Actividad en DRAFT (propuesta), con participantes opcionales',
  })
  create(
    @AuthenticatedUser() user: PublicUser,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(user.id, dto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Cancelar actividad (solo ADMIN)',
    description:
      'Permitido desde DRAFT (propuesta) o CONFIRMED. Rechazado si ya está CANCELLED o FINALIZADA.',
  })
  @ApiBadRequestResponse({
    description: 'Ya cancelada, finalizada u otro estado que impide cancelar',
  })
  cancel(@Param('id') id: string) {
    return this.activitiesService.cancel(id);
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Confirmar actividad en propuesta → confirmada (solo ADMIN)',
    description:
      'Solo desde DRAFT (propuesta). Valida quórum, disponibilidad de participantes y ausencia de conflictos con otras actividades confirmadas.',
  })
  @ApiBadRequestResponse({
    description:
      'No está en DRAFT, quórum, disponibilidad o conflicto de agenda',
  })
  confirm(@Param('id') id: string) {
    return this.activitiesService.confirm(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Actualizar actividad en propuesta / DRAFT (solo ADMIN)',
    description:
      'Solo actividades en DRAFT (propuesta). CONFIRMADA, CANCELADA y FINALIZADA no admiten cambios estructurales ni de metadatos por este endpoint.',
  })
  @ApiBadRequestResponse({
    description:
      'Actividad no está en DRAFT (propuesta); edición no permitida por estado',
  })
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activitiesService.update(id, dto);
  }
}
