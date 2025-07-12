import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { RecordRequestDto } from './dto/record-request.dto';

@Injectable()
export class RecordingService {
  constructor(
    @InjectRepository(Request)
    private requestRepository: Repository<Request>,
  ) {}

  async recordRequest(
    apiKeyId: string,
    recordRequestDto: RecordRequestDto,
  ): Promise<Request> {
    const request = this.requestRepository.create({
      ...recordRequestDto,
      apiId: recordRequestDto.apiId ?? '',
      apiKeyId: apiKeyId,
    });

    return await this.requestRepository.save(request);
  }

  async findAllByUser(apiKeyId: string): Promise<Request[]> {
    return await this.requestRepository.find({
      where: { apiKeyId },
      relations: ['apiKey'],
      order: { timestamp: 'DESC' },
    });
  }

  async findOne(id: string, apiKeyId: string): Promise<Request | null> {
    return await this.requestRepository.findOne({
      where: { id, apiKeyId },
      relations: ['apiKey'],
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const request = await this.findOne(id, userId);
    if (request) {
      await this.requestRepository.remove(request);
    }
  }

  async getRecordedRequests(
    apiId: string,
    limit: number = 50,
    offset: number = 0,
    endpoint?: string,
    method?: string,
  ): Promise<{ requests: Request[]; total: number }> {
    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .where('request.apiId = :apiId', { apiId })
      .orderBy('request.timestamp', 'DESC');

    if (endpoint) {
      queryBuilder.andWhere('request.endpoint ILIKE :endpoint', {
        endpoint: `%${endpoint}%`,
      });
    }

    if (method) {
      queryBuilder.andWhere('request.method = :method', { method });
    }

    const [requests, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { requests, total };
  }

  async getRequestStats(apiId: string): Promise<any> {
    const stats = await this.requestRepository
      .createQueryBuilder('request')
      .select([
        'COUNT(*) as total_requests',
        'COUNT(DISTINCT request.endpoint) as unique_endpoints',
        'AVG(request.duration) as avg_duration',
        'request.method',
        'COUNT(request.method) as method_count',
      ])
      .where('request.apiId = :apiId', { apiId })
      .groupBy('request.method')
      .getRawMany();

    return stats;
  }
}
