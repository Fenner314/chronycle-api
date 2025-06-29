import { ApiProperty } from '@nestjs/swagger';

export class HealthDto {
  @ApiProperty({
    description: 'Service status',
    example: 'ok',
  })
  status: string;

  @ApiProperty({
    description: 'Service name',
    example: 'API Request Recorder',
  })
  service: string;

  @ApiProperty({
    description: 'Service version',
    example: '1.0.0',
  })
  version: string;

  @ApiProperty({
    description: 'Current timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Uptime in seconds',
    example: 3600,
  })
  uptime: number;

  @ApiProperty({
    description: 'Environment',
    example: 'development',
  })
  environment: string;
}
