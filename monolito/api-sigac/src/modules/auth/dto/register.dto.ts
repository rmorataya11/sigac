import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'María García' })
  @IsString()
  @MaxLength(200)
  fullName: string;

  @ApiProperty({ example: 'maria@ejemplo.com' })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({
    example: 'claveSegura1',
    minLength: 8,
    description: 'El registro público siempre crea rol COLABORADOR.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
