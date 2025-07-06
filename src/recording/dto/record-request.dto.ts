import {
  IsString,
  IsNumber,
  IsObject,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordRequestDto {
  @ApiProperty()
  @IsString()
  apiId: string;

  @ApiProperty()
  @IsString()
  endpoint: string;

  @ApiProperty()
  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])
  method: string;

  @ApiProperty()
  @IsObject()
  headers: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  queryParams?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  requestBody?: string;

  @ApiProperty()
  @IsObject()
  responseHeaders: Record<string, any>;

  @ApiProperty()
  @IsNumber()
  statusCode: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  responseBody?: string;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
