import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordedRequest } from './entities/recorded-request.entity';
import { RecordRequestDto } from './dto/record-request.dto';

@Injectable()
export class RecordingService {
  constructor(
    @InjectRepository(RecordedRequest)
    private recordedRequestRepository: Repository<RecordedRequest>,
  ) {}

  async recordRequest(
    recordRequestDto: RecordRequestDto,
  ): Promise<RecordedRequest> {
    const recordedRequest = this.recordedRequestRepository.create({
      ...recordRequestDto,
      timestamp: new Date(),
    });

    return await this.recordedRequestRepository.save(recordedRequest);
  }

  async getRecordedRequests(
    apiId: string,
    limit: number = 50,
    offset: number = 0,
    endpoint?: string,
    method?: string,
  ): Promise<{ requests: RecordedRequest[]; total: number }> {
    const queryBuilder = this.recordedRequestRepository
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

  async getRequestById(id: string): Promise<RecordedRequest | null> {
    return await this.recordedRequestRepository.findOne({ where: { id } });
  }

  async deleteRequest(id: string): Promise<void> {
    await this.recordedRequestRepository.delete(id);
  }

  async getRequestStats(apiId: string): Promise<any> {
    const stats = await this.recordedRequestRepository
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
