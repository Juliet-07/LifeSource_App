import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  ValidateIf,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodType, DonationType, ActiveRole } from '../../common/enums';

export class RegisterDto {
  @ApiProperty({ example: 'Jane' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Okafor' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mypassword' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    enum: BloodType,
    example: BloodType.O_POSITIVE,
    description:
      'Blood type is required at registration and applies to both donor and recipient contexts',
  })
  @IsEnum(BloodType)
  bloodType: BloodType;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Lagos State' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'Nigeria' })
  @IsOptional()
  @IsString()
  country?: string;

  // Donor profile fields (optional at signup, can be updated later)
  @ApiPropertyOptional({ example: 70, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({ enum: DonationType })
  @IsOptional()
  @IsEnum(DonationType)
  preferredDonationType?: DonationType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;
}

export class LoginDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mypassword' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SwitchRoleDto {
  @ApiProperty({
    enum: ActiveRole,
    example: ActiveRole.DONOR,
    description: 'Switch between donor and recipient context',
  })
  @IsEnum(ActiveRole)
  activeRole: ActiveRole;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class UpdateFcmTokenDto {
  @ApiProperty({
    description: 'Firebase Cloud Messaging token for push notifications',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}
