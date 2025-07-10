import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'src/recording/entities/request.entity';
import { Repository } from 'typeorm';
import { ApiKeysService } from 'src/api-keys/api-keys.service';
import { AxiosService } from 'src/common/services/axios.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ReplayRequestResponse } from './types/replay-request-response.interface';

@Injectable()
export class ReplayService {
  constructor(
    @InjectRepository(Request)
    private requestRepository: Repository<Request>,
    private apiKeysService: ApiKeysService,
    private axiosService: AxiosService,
  ) {}

  async replayRequest(
    requestId: string,
    apiKey: string,
  ): Promise<ReplayRequestResponse> {
    const request = await this.findValidRequest(apiKey, requestId);

    if (!request) {
      throw new UnauthorizedException('Invalid API key or request not found');
    }

    try {
      const response = await this.executeRequest(request);
      return response;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to replay request: ${message}`,
      );
    }
  }

  async findValidRequest(
    apiKey: string,
    requestId: string,
  ): Promise<Request | null> {
    try {
      const request = await this.requestRepository.findOne({
        where: {
          id: requestId,
        },
      });

      if (!request) {
        return null;
      }

      const isValidApiKey = await this.apiKeysService.verifyApiKey(
        request.userId,
        apiKey,
      );

      if (!isValidApiKey) {
        return null;
      }

      return request;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        'Failed to find valid request: ',
        message,
      );
    }
  }

  private async executeRequest(
    request: Request,
  ): Promise<ReplayRequestResponse> {
    try {
      const { response, duration } = await this.makeReplayRequest(
        request.method,
        request.endpoint,
        request.headers,
        request.queryParams,
        request.requestBody,
      );

      return {
        statusCode: response.status,
        headers: response.headers,
        body: response.data,
        duration, // Duration in milliseconds
        originalRequest: {
          id: request.id,
          method: request.method,
          endpoint: request.endpoint,
          timestamp: request.timestamp,
          duration: request.duration, // Original request duration
        },
        replayTimestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to execute request: ${message}`);
    }
  }

  private async makeReplayRequest(
    method: string,
    url: string,
    headers?: Record<string, any>,
    queryParams?: Record<string, any>,
    body?: any,
  ): Promise<{ response: AxiosResponse<{ data: any }>; duration: number }> {
    // Warm the connection first
    await this.axiosService.warmConnection(url);

    // Optimize for performance by avoiding unnecessary object creation
    const config: AxiosRequestConfig = {
      method: method.toLowerCase(),
      url,
      headers: this.sanitizeHeaders(headers),
    };

    // Only add params if they exist and have keys
    if (queryParams && Object.keys(queryParams).length > 0) {
      config.params = queryParams;
    }

    // Only add data if body exists
    if (body !== undefined && body !== null) {
      config.data = body;
    }

    const requestStart = Date.now();
    const response = await this.axiosService.request(config);
    const duration = Date.now() - requestStart;

    return { response, duration };
  }

  private sanitizeHeaders(headers?: Record<string, any>): Record<string, any> {
    if (!headers || Object.keys(headers).length === 0) return {};

    const sanitized = { ...headers };
    // Use Set for O(1) lookup performance
    const sensitiveHeaders = new Set([
      'host',
      'content-length',
      'connection',
      'x-api-key',
    ]);

    Object.keys(sanitized).forEach((header) => {
      if (sensitiveHeaders.has(header.toLowerCase())) {
        delete sanitized[header];
      }
    });

    return sanitized;
  }
}
