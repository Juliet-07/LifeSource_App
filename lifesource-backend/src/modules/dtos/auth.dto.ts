import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsNumber,
  IsArray,
  IsLatitude,
  IsLongitude,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodType, UserRole, DonationType } from '../../common/enums';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.DONOR })
  @IsEnum(UserRole)
  role: UserRole;

  // Only required when role is DONOR
  @ApiProperty({ enum: BloodType, example: BloodType.O_POSITIVE })
  @ValidateIf((o) => o.role === UserRole.DONOR)
  @IsEnum(BloodType)
  bloodType?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Ikeja' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'Nigeria' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 3.3792 })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 6.5244 })
  @IsOptional()
  longitude?: number;

  // Donor-specific fields
  @ApiPropertyOptional({ example: true })
  @ValidateIf((o) => o.role === UserRole.DONOR)
  @IsOptional()
  consentGiven?: boolean;

  @ApiPropertyOptional({ enum: DonationType })
  @ValidateIf((o) => o.role === UserRole.DONOR)
  @IsOptional()
  @IsEnum(DonationType)
  preferredDonationType?: string;

  @ApiPropertyOptional({ example: 70 })
  @ValidateIf((o) => o.role === UserRole.DONOR)
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 28 })
  @ValidateIf((o) => o.role === UserRole.DONOR)
  @IsOptional()
  @IsNumber()
  age?: number;
}

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
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
  @MinLength(8)
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
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
