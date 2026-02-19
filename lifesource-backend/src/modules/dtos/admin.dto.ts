import {
  IsEnum,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsNumber,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BroadcastTarget } from '../../common/enums';

export class ApproveHospitalDto {
  @ApiPropertyOptional({
    description: 'Rejection reason (required for reject action)',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssignCredentialsDto {
  @ApiProperty({ description: 'User ID to assign as hospital admin' })
  @IsMongoId()
  userId: string;
}

export class RedirectRequestDto {
  @ApiProperty({ description: 'Hospital ID to redirect the request to' })
  @IsMongoId()
  hospitalId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

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
