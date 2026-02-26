import {
  IsEnum,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsNumber,
  IsArray,
  IsNotEmpty,
  IsEmail,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BroadcastTarget } from '../../common/enums';
import { InstitutionType } from '../schemas';

// ─── Super Admin ───────────────────────────────────────────────────────────────

export class CreateSuperAdminDto {
  @ApiProperty({ example: 'Admin' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'admin@bloodlink.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongpassword' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone?: string;
}


// ─── Hospital Management ───────────────────────────────────────────────────────

export class CreateHospitalDto {
  @ApiProperty({ enum: InstitutionType, example: InstitutionType.HOSPITAL })
  @IsEnum(InstitutionType)
  institutionType: InstitutionType;

  @ApiProperty({ example: 'Lagos General Hospital' })
  @IsString()
  @IsNotEmpty()
  institutionName: string;

  @ApiProperty({ example: 'info@lagosgeneral.org' })
  @IsEmail()
  officialEmail: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: 'LIC/MED/2020/0042' })
  @IsString()
  @IsNotEmpty()
  licenseRegNo: string;

  @ApiProperty({ example: 200, description: 'Max blood unit capacity' })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: '12 Hospital Road, Victoria Island' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Lagos State' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({ example: '101001' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ example: 'Nigeria' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    example: 'Dr. Amina Bello',
    description: 'Full name of the contact person',
  })
  @IsString()
  @IsNotEmpty()
  contactFullName: string;

  @ApiProperty({
    example: 'amina.bello@lagosgeneral.org',
    description: 'Login email for the hospital admin user account',
  })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ example: '+2348098765432' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @ApiPropertyOptional({
    example: 'Primary trauma center with 24/7 blood bank.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ApproveHospitalDto {
  @ApiPropertyOptional({
    description: 'Rejection reason (required for reject action)',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectHospitalDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateHospitalDto {
  @ApiPropertyOptional({ enum: InstitutionType })
  @IsOptional()
  @IsEnum(InstitutionType)
  institutionType?: InstitutionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  institutionName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  officialEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseRegNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactFullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

// ─── Request Management ────────────────────────────────────────────────────────

export class RedirectRequestDto {
  @ApiProperty({ description: 'Hospital ID to redirect the request to' })
  @IsMongoId()
  hospitalId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

// ─── Broadcast DTOs ───────────────────────────────────────────────────────────────
export class CreateBroadcastDto {
  @ApiProperty({ example: 'Urgent Blood Shortage Alert' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'We urgently need O- blood donors in Lagos. Please donate today!',
  })
  @IsString()
  message: string;

  @ApiProperty({ enum: BroadcastTarget, example: BroadcastTarget.DONORS })
  @IsEnum(BroadcastTarget)
  target: BroadcastTarget;

  @ApiPropertyOptional({ type: [String], description: 'Filter by blood types' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetBloodTypes?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Filter by cities' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCities?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPushEnabled?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isEmailEnabled?: boolean;
}

// ─── Query DTOs ───────────────────────────────────────────────────────────────
export class UserManagementQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by blood type e.g. O+' })
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'true = active only, false = inactive only',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Hospital ID to filter by' })
  @IsOptional()
  @IsMongoId()
  hospitalId?: string;

  @ApiPropertyOptional({
    description: 'Group by: day, week, month',
    default: 'month',
  })
  @IsOptional()
  @IsString()
  groupBy?: string;
}

export class SuspendUserDto {
  @ApiProperty({ description: 'Reason for suspension/deactivation' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
