import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { randomBytes } from 'crypto';
import { ApiKeyUsageStats } from './types/api-key-usage-stats.interface';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeysRepository: Repository<ApiKey>,
  ) {}

  async create(
    userId: string,
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKey> {
    const key = this.generateApiKey();

    const apiKey = this.apiKeysRepository.create({
      ...createApiKeyDto,
      key,
      userId,
      expiresAt: createApiKeyDto.expiresAt
        ? new Date(createApiKeyDto.expiresAt)
        : null,
    });

    return await this.apiKeysRepository.save(apiKey);
  }

  async findAllByUser(userId: string): Promise<ApiKey[]> {
    return await this.apiKeysRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeysRepository.findOne({
      where: { id, userId },
      relations: ['user'],
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return apiKey;
  }

  async findByKey(key: string): Promise<ApiKey | null> {
    return await this.apiKeysRepository.findOne({
      where: { key, isActive: true },
      relations: ['user'],
    });
  }

  async update(
    id: string,
    userId: string,
    updateApiKeyDto: UpdateApiKeyDto,
  ): Promise<ApiKey> {
    const apiKey = await this.findOne(id, userId);

    Object.assign(apiKey, {
      ...updateApiKeyDto,
      expiresAt: updateApiKeyDto.expiresAt
        ? new Date(updateApiKeyDto.expiresAt)
        : null,
    });

    return await this.apiKeysRepository.save(apiKey);
  }

  async remove(id: string, userId: string): Promise<void> {
    const apiKey = await this.findOne(id, userId);
    await this.apiKeysRepository.remove(apiKey);
  }

  async validateApiKey(
    key: string,
    ipAddress?: string,
  ): Promise<ApiKey | null> {
    const apiKey = await this.findByKey(key);

    if (!apiKey || !apiKey.isActive || apiKey.isExpired) {
      return null;
    }

    // Update usage statistics
    await this.updateUsageStats(apiKey.id, ipAddress);

    return apiKey;
  }

  async updateUsageStats(apiKeyId: string, ipAddress?: string): Promise<void> {
    await this.apiKeysRepository.update(apiKeyId, {
      usageCount: () => 'usageCount + 1',
      lastUsedAt: new Date(),
      lastUsedIp: ipAddress,
    });
  }

  async deactivate(id: string, userId: string): Promise<ApiKey> {
    const apiKey = await this.findOne(id, userId);
    apiKey.isActive = false;
    return await this.apiKeysRepository.save(apiKey);
  }

  async regenerate(id: string, userId: string): Promise<ApiKey> {
    const apiKey = await this.findOne(id, userId);
    apiKey.key = this.generateApiKey();
    apiKey.usageCount = 0;
    apiKey.lastUsedAt = null;
    return await this.apiKeysRepository.save(apiKey);
  }

  private generateApiKey(): string {
    const prefix = 'cs_';
    const key = randomBytes(32).toString('hex');
    return `${prefix}${key}`;
  }

  async getUsageStats(userId: string): Promise<ApiKeyUsageStats> {
    const stats = (await this.apiKeysRepository
      .createQueryBuilder('apiKey')
      .select([
        'COUNT(*) as total_keys',
        'SUM(apiKey.usageCount) as total_usage',
        'COUNT(CASE WHEN apiKey.isActive = true THEN 1 END) as active_keys',
        'COUNT(CASE WHEN apiKey.expiresAt < NOW() THEN 1 END) as expired_keys',
      ])
      .where('apiKey.userId = :userId', { userId })
      .getRawOne()) as {
      total_keys: number;
      total_usage: number;
      active_keys: number;
      expired_keys: number;
    };

    return stats;
  }
}
