import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthDto } from 'src/dto/health.dto';
import { ApiResponseWrapper } from 'src/decorators/api-response.decorator';
import { ChronicleConfigService } from 'src/services/common/chronicle-config.service';
import { EnvKeys } from 'src/types/common/EnvKeys.enum';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly configService: ChronicleConfigService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status of the service',
  })
  @ApiResponseWrapper(HealthDto, 200, 'Service is healthy')
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  getHealth(): HealthDto {
    return {
      status: 'ok',
      service: 'API Request Recorder',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: this.configService.get(EnvKeys.NODE_ENV) || 'development',
    };
  }

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ping endpoint',
    description: 'Simple ping endpoint for basic connectivity testing',
  })
  @ApiResponse({
    status: 200,
    description: 'Pong response',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'pong',
            },
            timestamp: {
              type: 'string',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
        },
        statusCode: {
          type: 'number',
          example: 200,
        },
        message: {
          type: 'string',
          example: 'Success',
        },
        timestamp: {
          type: 'string',
          example: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  ping(): { message: string; timestamp: string } {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Service information',
    description: 'Returns detailed information about the service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service information',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'API Request Recorder',
            },
            version: {
              type: 'string',
              example: '1.0.0',
            },
            description: {
              type: 'string',
              example:
                'Central service for recording and replaying API requests',
            },
            environment: {
              type: 'string',
              example: 'development',
            },
            nodeVersion: {
              type: 'string',
              example: 'v18.0.0',
            },
            platform: {
              type: 'string',
              example: 'linux',
            },
            memory: {
              type: 'object',
              properties: {
                used: {
                  type: 'number',
                  example: 123456789,
                },
                total: {
                  type: 'number',
                  example: 987654321,
                },
                free: {
                  type: 'number',
                  example: 864197532,
                },
              },
            },
          },
        },
        statusCode: {
          type: 'number',
          example: 200,
        },
        message: {
          type: 'string',
          example: 'Success',
        },
        timestamp: {
          type: 'string',
          example: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  getInfo(): {
    name: string;
    version: string;
    description: string;
    environment: string;
    nodeVersion: string;
    platform: string;
    memory: {
      used: number;
      total: number;
      free: number;
    };
  } {
    const memUsage = process.memoryUsage();

    return {
      name: 'API Request Recorder',
      version: '1.0.0',
      description: 'Central service for recording and replaying API requests',
      environment: this.configService.get(EnvKeys.NODE_ENV) || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        free: Math.round(
          (memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024,
        ),
      },
    };
  }
}
