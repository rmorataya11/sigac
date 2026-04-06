import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../../common/decorators/authenticated-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/prisma-enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { PublicUser } from '../../common/types/public-user.type';
import { AvailabilityService } from './availability.service';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@ApiTags('availability')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @ApiOperation({ summary: 'Crear disponibilidad (solo la propia)' })
  @ApiCreatedResponse({ type: AvailabilityResponseDto })
  create(
    @AuthenticatedUser() user: PublicUser,
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Listar mis disponibilidades' })
  @ApiOkResponse({ type: AvailabilityResponseDto, isArray: true })
  findMine(@AuthenticatedUser() user: PublicUser) {
    return this.availabilityService.findMine(user.id);
  }

  @Get('global')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Listar disponibilidades de todos los usuarios',
    description:
      'Exclusivo para usuarios con rol ADMIN. Requiere JWT válido y permisos de administrador.',
  })
  @ApiOkResponse({ type: AvailabilityResponseDto, isArray: true })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no tiene rol ADMIN',
  })
  findGlobal() {
    return this.availabilityService.findGlobal();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una disponibilidad propia' })
  @ApiOkResponse({ type: AvailabilityResponseDto })
  update(
    @AuthenticatedUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una disponibilidad propia' })
  @ApiOkResponse({
    schema: { example: { success: true } },
  })
  async remove(@AuthenticatedUser() user: PublicUser, @Param('id') id: string) {
    await this.availabilityService.remove(user.id, id);
    return { success: true };
  }
}
