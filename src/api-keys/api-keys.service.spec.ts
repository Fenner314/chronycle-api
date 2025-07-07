import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { User } from '../users/entities/user.entity';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let mockRepository: jest.Mocked<Repository<ApiKey>>;

  // Test data factory functions
  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    isActive: true,
    isEmailVerified: true,
    emailVerificationToken: '',
    passwordResetToken: '',
    passwordResetExpires: new Date(),
    apiKeys: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    fullName: 'John Doe',
    ...overrides,
  });

  const createMockApiKey = (overrides: Partial<ApiKey> = {}): ApiKey => ({
    id: 'api-key-1',
    key: 'cs_test123456789abcdef',
    name: 'Test API Key',
    description: 'Test description',
    isActive: true,
    expiresAt: null,
    usageCount: 0,
    lastUsedAt: null,
    lastUsedIp: null,
    permissions: ['read', 'write'],
    user: createMockUser(),
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isExpired: false,
    ...overrides,
  });

  beforeEach(async () => {
    const mockRepositoryFactory = () => ({
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      })),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: getRepositoryToken(ApiKey),
          useFactory: mockRepositoryFactory,
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    mockRepository = module.get(getRepositoryToken(ApiKey));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new API key', async () => {
      const createApiKeyDto: CreateApiKeyDto = {
        name: 'Test API Key',
        description: 'Test description',
        permissions: ['read', 'write'],
      };
      const userId = 'user-1';
      const mockApiKey = createMockApiKey();

      const createSpy = jest
        .spyOn(mockRepository, 'create')
        .mockReturnValue(mockApiKey);
      const saveSpy = jest
        .spyOn(mockRepository, 'save')
        .mockResolvedValue(mockApiKey);

      const result = await service.create(userId, createApiKeyDto);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createApiKeyDto,
          userId,
          expiresAt: null,
          key: expect.stringMatching(/^cs_[a-f0-9]{64}$/) as string,
        }),
      );
      expect(saveSpy).toHaveBeenCalledWith(mockApiKey);
      expect(result).toEqual(mockApiKey);
    });

    it('should create API key with expiration date', async () => {
      const expiresAt = '2024-12-31T23:59:59.000Z';
      const createApiKeyDto: CreateApiKeyDto = {
        name: 'Test API Key',
        expiresAt,
      };
      const userId = 'user-1';
      const mockApiKey = createMockApiKey();

      mockRepository.create.mockReturnValue(mockApiKey);
      mockRepository.save.mockResolvedValue(mockApiKey);

      await service.create(userId, createApiKeyDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createApiKeyDto,
          userId,
          expiresAt: new Date(expiresAt),
          key: expect.stringMatching(/^cs_[a-f0-9]{64}$/) as string,
        }),
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return all API keys for a user', async () => {
      const userId = 'user-1';
      const mockApiKeys = [createMockApiKey()];

      mockRepository.find.mockResolvedValue(mockApiKeys);

      const result = await service.findAllByUser(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockApiKeys);
    });
  });

  describe('findOne', () => {
    it('should return an API key by id and userId', async () => {
      const id = 'api-key-1';
      const userId = 'user-1';
      const mockApiKey = createMockApiKey();

      mockRepository.findOne.mockResolvedValue(mockApiKey);

      const result = await service.findOne(id, userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, userId },
        relations: ['user'],
      });
      expect(result).toEqual(mockApiKey);
    });

    it('should throw NotFoundException when API key not found', async () => {
      const id = 'non-existent';
      const userId = 'user-1';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByKey', () => {
    it('should return an active API key by key', async () => {
      const key = 'rr_test123456789abcdef';
      const mockApiKey = createMockApiKey({ key });

      mockRepository.findOne.mockResolvedValue(mockApiKey);

      const result = await service.findByKey(key);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { key, isActive: true },
        relations: ['user'],
      });
      expect(result).toEqual(mockApiKey);
    });

    it('should return null when API key not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByKey('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an API key', async () => {
      const id = 'api-key-1';
      const userId = 'user-1';
      const updateApiKeyDto: UpdateApiKeyDto = {
        name: 'Updated API Key',
        description: 'Updated description',
      };
      const mockApiKey = createMockApiKey();
      const updatedApiKey = createMockApiKey({
        ...updateApiKeyDto,
        expiresAt: new Date(updateApiKeyDto.expiresAt || ''),
      });

      jest.spyOn(service, 'findOne').mockResolvedValue(mockApiKey);
      mockRepository.save.mockResolvedValue(updatedApiKey);

      const result = await service.update(id, userId, updateApiKeyDto);

      expect(service.findOne).toHaveBeenCalledWith(id, userId);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockApiKey,
          ...updateApiKeyDto,
          expiresAt: null,
        }),
      );
      expect(result).toEqual(updatedApiKey);
    });
  });

  describe('remove', () => {
    it('should remove an API key', async () => {
      const id = 'api-key-1';
      const userId = 'user-1';
      const mockApiKey = createMockApiKey();

      jest.spyOn(service, 'findOne').mockResolvedValue(mockApiKey);
      mockRepository.remove.mockResolvedValue(mockApiKey);

      await service.remove(id, userId);

      expect(service.findOne).toHaveBeenCalledWith(id, userId);
      expect(mockRepository.remove).toHaveBeenCalledWith(mockApiKey);
    });
  });

  describe('validateApiKey', () => {
    const testCases = [
      {
        description: 'should return API key when valid',
        apiKey: createMockApiKey(),
        ipAddress: '192.168.1.1',
        expectedResult: true,
      },
      {
        description: 'should return null when API key is inactive',
        apiKey: createMockApiKey({ isActive: false }),
        expectedResult: false,
      },
      {
        description: 'should return null when API key is expired',
        apiKey: createMockApiKey({
          expiresAt: new Date('2020-01-01'),
          isExpired: true,
        }),
        expectedResult: false,
      },
    ];

    testCases.forEach(({ description, apiKey, ipAddress, expectedResult }) => {
      it(description, async () => {
        const key = apiKey.key;

        jest.spyOn(service, 'findByKey').mockResolvedValue(apiKey);
        jest.spyOn(service, 'updateUsageStats').mockResolvedValue();

        const result = await service.validateApiKey(key, ipAddress);

        expect(service.findByKey).toHaveBeenCalledWith(key);

        if (expectedResult) {
          expect(service.updateUsageStats).toHaveBeenCalledWith(
            apiKey.id,
            ipAddress,
          );
          expect(result).toEqual(apiKey);
        } else {
          expect(result).toBeNull();
        }
      });
    });

    it('should return null when API key not found', async () => {
      jest.spyOn(service, 'findByKey').mockResolvedValue(null);

      const result = await service.validateApiKey('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateUsageStats', () => {
    it('should update usage statistics', async () => {
      const apiKeyId = 'api-key-1';
      const ipAddress = '192.168.1.1';

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.updateUsageStats(apiKeyId, ipAddress);

      expect(mockRepository.update).toHaveBeenCalledWith(apiKeyId, {
        usageCount: expect.any(Function),
        lastUsedAt: expect.any(Date),
        lastUsedIp: ipAddress,
      });
    });
  });

  describe('deactivate', () => {
    it('should deactivate an API key', async () => {
      const id = 'api-key-1';
      const userId = 'user-1';
      const mockApiKey = createMockApiKey();
      const deactivatedApiKey = createMockApiKey({ isActive: false });

      jest.spyOn(service, 'findOne').mockResolvedValue(mockApiKey);
      mockRepository.save.mockResolvedValue(deactivatedApiKey);

      const result = await service.deactivate(id, userId);

      expect(service.findOne).toHaveBeenCalledWith(id, userId);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ ...mockApiKey, isActive: false }),
      );
      expect(result).toEqual(deactivatedApiKey);
    });
  });

  describe('regenerate', () => {
    it('should regenerate an API key', async () => {
      const id = 'api-key-1';
      const userId = 'user-1';
      const mockApiKey = createMockApiKey();
      const regeneratedApiKey = createMockApiKey({ key: 'rr_newkey123456' });

      jest.spyOn(service, 'findOne').mockResolvedValue(mockApiKey);
      mockRepository.save.mockResolvedValue(regeneratedApiKey);

      const result = await service.regenerate(id, userId);

      expect(service.findOne).toHaveBeenCalledWith(id, userId);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockApiKey,
          key: expect.stringMatching(/^cs_[a-f0-9]{64}$/) as string,
          usageCount: 0,
          lastUsedAt: null,
        }),
      );
      expect(result).toEqual(regeneratedApiKey);
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics for a user', async () => {
      const userId = 'user-1';
      const mockStats = {
        total_keys: '5',
        total_usage: '100',
        active_keys: '3',
        expired_keys: '1',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockStats),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getUsageStats(userId);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('apiKey');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'COUNT(*) as total_keys',
        'SUM(apiKey.usageCount) as total_usage',
        'COUNT(CASE WHEN apiKey.isActive = true THEN 1 END) as active_keys',
        'COUNT(CASE WHEN apiKey.expiresAt < NOW() THEN 1 END) as expired_keys',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'apiKey.userId = :userId',
        { userId },
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe('generateApiKey', () => {
    it('should generate API key with correct format', async () => {
      const createApiKeyDto: CreateApiKeyDto = { name: 'Test API Key' };
      const mockApiKey = createMockApiKey();

      mockRepository.create.mockReturnValue(mockApiKey);
      mockRepository.save.mockResolvedValue(mockApiKey);

      await service.create('user-1', createApiKeyDto);

      const createCall = mockRepository.create.mock.calls[0]?.[0];
      expect(createCall?.key).toMatch(/^cs_[a-f0-9]{64}$/);
    });
  });
});
