import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { JwtRequest } from '../auth/dto/jwt-request.dto';
import { ApiKey } from './entities/api-key.entity';
import { User } from '../users/entities/user.entity';
import { ApiKeyUsageStats } from './types/api-key-usage-stats.interface';

describe('ApiKeysController', () => {
  let controller: ApiKeysController;
  let service: jest.Mocked<ApiKeysService>;

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
    key: 'rr_test123456789abcdef',
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

  const createMockJwtRequest = (
    overrides: Partial<JwtRequest> = {},
  ): JwtRequest =>
    ({
      user: createMockUser(),
      ...overrides,
    }) as JwtRequest;

  const mockApiKeysService = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    deactivate: jest.fn(),
    regenerate: jest.fn(),
    getUsageStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
        },
      ],
    }).compile();

    controller = module.get<ApiKeysController>(ApiKeysController);
    service = module.get(ApiKeysService);
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
      const mockRequest = createMockJwtRequest();
      const mockApiKey = createMockApiKey();

      service.create.mockResolvedValue(mockApiKey);

      const result = await controller.create(mockRequest, createApiKeyDto);

      expect(service.create).toHaveBeenCalledWith(
        mockRequest.user.id,
        createApiKeyDto,
      );
      expect(result).toEqual(mockApiKey);
    });

    it('should create API key with different user', async () => {
      const createApiKeyDto: CreateApiKeyDto = {
        name: 'Another API Key',
      };
      const differentUser = createMockUser({
        id: 'user-2',
        email: 'different@example.com',
      });
      const mockRequest = createMockJwtRequest({ user: differentUser });
      const mockApiKey = createMockApiKey({ userId: 'user-2' });

      service.create.mockResolvedValue(mockApiKey);

      const result = await controller.create(mockRequest, createApiKeyDto);

      expect(service.create).toHaveBeenCalledWith('user-2', createApiKeyDto);
      expect(result).toEqual(mockApiKey);
    });
  });

  describe('findAll', () => {
    it('should return all API keys for current user', async () => {
      const mockRequest = createMockJwtRequest();
      const mockApiKeys = [
        createMockApiKey(),
        createMockApiKey({ id: 'api-key-2' }),
      ];

      service.findAllByUser.mockResolvedValue(mockApiKeys);

      const result = await controller.findAll(mockRequest);

      expect(service.findAllByUser).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual(mockApiKeys);
    });

    it('should return empty array when user has no API keys', async () => {
      const mockRequest = createMockJwtRequest();

      service.findAllByUser.mockResolvedValue([]);

      const result = await controller.findAll(mockRequest);

      expect(service.findAllByUser).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return usage statistics', async () => {
      const mockRequest = createMockJwtRequest();
      const mockStats: ApiKeyUsageStats = {
        total_keys: 5,
        total_usage: 100,
        active_keys: 3,
        expired_keys: 1,
      };

      service.getUsageStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockRequest);

      expect(service.getUsageStats).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual(mockStats);
    });
  });

  describe('findOne', () => {
    it('should return a specific API key', async () => {
      const id = 'api-key-1';
      const mockRequest = createMockJwtRequest();
      const mockApiKey = createMockApiKey({ id });

      service.findOne.mockResolvedValue(mockApiKey);

      const result = await controller.findOne(id, mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(id, mockRequest.user.id);
      expect(result).toEqual(mockApiKey);
    });

    it('should handle different API key ID', async () => {
      const id = 'different-api-key';
      const mockRequest = createMockJwtRequest();
      const mockApiKey = createMockApiKey({ id });

      service.findOne.mockResolvedValue(mockApiKey);

      const result = await controller.findOne(id, mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(id, mockRequest.user.id);
      expect(result).toEqual(mockApiKey);
    });
  });

  describe('update', () => {
    it('should update an API key', async () => {
      const id = 'api-key-1';
      const updateApiKeyDto: UpdateApiKeyDto = {
        name: 'Updated API Key',
        description: 'Updated description',
      };
      const mockRequest = createMockJwtRequest();
      const updatedApiKey = createMockApiKey({
        id,
        name: updateApiKeyDto.name,
        description: updateApiKeyDto.description,
      });

      service.update.mockResolvedValue(updatedApiKey);

      const result = await controller.update(id, mockRequest, updateApiKeyDto);

      expect(service.update).toHaveBeenCalledWith(
        id,
        mockRequest.user.id,
        updateApiKeyDto,
      );
      expect(result).toEqual(updatedApiKey);
    });

    it('should update API key with minimal data', async () => {
      const id = 'api-key-1';
      const updateApiKeyDto: UpdateApiKeyDto = {
        name: 'New Name Only',
      };
      const mockRequest = createMockJwtRequest();
      const updatedApiKey = createMockApiKey({
        id,
        name: updateApiKeyDto.name,
      });

      service.update.mockResolvedValue(updatedApiKey);

      const result = await controller.update(id, mockRequest, updateApiKeyDto);

      expect(service.update).toHaveBeenCalledWith(
        id,
        mockRequest.user.id,
        updateApiKeyDto,
      );
      expect(result).toEqual(updatedApiKey);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an API key', async () => {
      const id = 'api-key-1';
      const mockRequest = createMockJwtRequest();
      const deactivatedApiKey = createMockApiKey({ id, isActive: false });

      service.deactivate.mockResolvedValue(deactivatedApiKey);

      const result = await controller.deactivate(id, mockRequest);

      expect(service.deactivate).toHaveBeenCalledWith(id, mockRequest.user.id);
      expect(result).toEqual(deactivatedApiKey);
    });
  });

  describe('regenerate', () => {
    it('should regenerate an API key', async () => {
      const id = 'api-key-1';
      const mockRequest = createMockJwtRequest();
      const regeneratedApiKey = createMockApiKey({
        id,
        key: 'rr_newkey123456789abcdef',
        usageCount: 0,
        lastUsedAt: null,
      });

      service.regenerate.mockResolvedValue(regeneratedApiKey);

      const result = await controller.regenerate(id, mockRequest);

      expect(service.regenerate).toHaveBeenCalledWith(id, mockRequest.user.id);
      expect(result).toEqual(regeneratedApiKey);
    });
  });

  describe('remove', () => {
    it('should delete an API key', async () => {
      const id = 'api-key-1';
      const mockRequest = createMockJwtRequest();

      service.remove.mockResolvedValue();

      const result = await controller.remove(id, mockRequest);

      expect(service.remove).toHaveBeenCalledWith(id, mockRequest.user.id);
      expect(result).toEqual({ message: 'API key deleted successfully' });
    });

    it('should handle different API key deletion', async () => {
      const id = 'different-api-key';
      const mockRequest = createMockJwtRequest();

      service.remove.mockResolvedValue();

      const result = await controller.remove(id, mockRequest);

      expect(service.remove).toHaveBeenCalledWith(id, mockRequest.user.id);
      expect(result).toEqual({ message: 'API key deleted successfully' });
    });
  });

  describe('error handling', () => {
    it('should propagate service errors in create', async () => {
      const createApiKeyDto: CreateApiKeyDto = { name: 'Test API Key' };
      const mockRequest = createMockJwtRequest();
      const error = new Error('Service error');

      service.create.mockRejectedValue(error);

      await expect(
        controller.create(mockRequest, createApiKeyDto),
      ).rejects.toThrow('Service error');
    });

    it('should propagate service errors in findOne', async () => {
      const id = 'api-key-1';
      const mockRequest = createMockJwtRequest();
      const error = new Error('Not found');

      service.findOne.mockRejectedValue(error);

      await expect(controller.findOne(id, mockRequest)).rejects.toThrow(
        'Not found',
      );
    });

    it('should propagate service errors in update', async () => {
      const id = 'api-key-1';
      const updateApiKeyDto: UpdateApiKeyDto = { name: 'Updated' };
      const mockRequest = createMockJwtRequest();
      const error = new Error('Update failed');

      service.update.mockRejectedValue(error);

      await expect(
        controller.update(id, mockRequest, updateApiKeyDto),
      ).rejects.toThrow('Update failed');
    });

    it('should propagate service errors in remove', async () => {
      const id = 'api-key-1';
      const mockRequest = createMockJwtRequest();
      const error = new Error('Delete failed');

      service.remove.mockRejectedValue(error);

      await expect(controller.remove(id, mockRequest)).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  describe('user context', () => {
    it('should use correct user ID from JWT token', async () => {
      const specificUserId = 'specific-user-123';
      const mockRequest = createMockJwtRequest({
        user: createMockUser({ id: specificUserId }),
      });

      service.findAllByUser.mockResolvedValue([]);

      await controller.findAll(mockRequest);

      expect(service.findAllByUser).toHaveBeenCalledWith(specificUserId);
    });

    it('should pass user ID to all service methods', async () => {
      const userId = 'test-user-456';
      const mockRequest = createMockJwtRequest({
        user: createMockUser({ id: userId }),
      });

      // Mock all service methods
      service.create.mockResolvedValue(createMockApiKey());
      service.findAllByUser.mockResolvedValue([]);
      service.findOne.mockResolvedValue(createMockApiKey());
      service.update.mockResolvedValue(createMockApiKey());
      service.deactivate.mockResolvedValue(createMockApiKey());
      service.regenerate.mockResolvedValue(createMockApiKey());
      service.remove.mockResolvedValue();
      service.getUsageStats.mockResolvedValue({} as ApiKeyUsageStats);

      // Test all methods
      await controller.create(mockRequest, { name: 'Test' });
      await controller.findAll(mockRequest);
      await controller.findOne('id', mockRequest);
      await controller.update('id', mockRequest, { name: 'Updated' });
      await controller.deactivate('id', mockRequest);
      await controller.regenerate('id', mockRequest);
      await controller.remove('id', mockRequest);
      await controller.getStats(mockRequest);

      // Verify user ID is passed to all service methods
      expect(service.create).toHaveBeenCalledWith(userId, expect.any(Object));
      expect(service.findAllByUser).toHaveBeenCalledWith(userId);
      expect(service.findOne).toHaveBeenCalledWith(expect.any(String), userId);
      expect(service.update).toHaveBeenCalledWith(
        expect.any(String),
        userId,
        expect.any(Object),
      );
      expect(service.deactivate).toHaveBeenCalledWith(
        expect.any(String),
        userId,
      );
      expect(service.regenerate).toHaveBeenCalledWith(
        expect.any(String),
        userId,
      );
      expect(service.remove).toHaveBeenCalledWith(expect.any(String), userId);
      expect(service.getUsageStats).toHaveBeenCalledWith(userId);
    });
  });
});
