import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReplayService } from './replay.service';
import { Request } from 'src/recording/entities/request.entity';
import { ApiKeysService } from 'src/api-keys/api-keys.service';
import { AxiosService } from 'src/common/services/axios.service';
import {
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('ReplayService', () => {
  let service: ReplayService;
  const mockRequest: Request = {
    id: 'test-request-id',
    userId: 'test-user-id',
    method: 'GET',
    endpoint: 'https://api.example.com/users/1',
    headers: { authorization: 'Bearer token' },
    queryParams: { limit: '10' },
    requestBody: null,
    timestamp: new Date('2025-07-10T10:30:00Z'),
    duration: 120,
  } as unknown as Request;

  const mockAxiosResponse = {
    status: 200,
    headers: { 'content-type': 'application/json' },
    data: { id: 1, name: 'Test User' },
  };

  const mockRepository = {
    findOne: jest.fn(),
  };

  const mockApiKeysService = {
    verifyApiKey: jest.fn(),
  };

  const mockAxiosService = {
    warmConnection: jest.fn(),
    request: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplayService,
        {
          provide: getRepositoryToken(Request),
          useValue: mockRepository,
        },
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
        },
        {
          provide: AxiosService,
          useValue: mockAxiosService,
        },
      ],
    }).compile();

    service = module.get<ReplayService>(ReplayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('replayRequest', () => {
    it('should replay request successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockRequest);
      mockApiKeysService.verifyApiKey.mockResolvedValue(true);
      mockAxiosService.warmConnection.mockResolvedValue(undefined);
      mockAxiosService.request.mockResolvedValue(mockAxiosResponse);

      // Act
      const result = await service.replayRequest(
        'test-request-id',
        'valid-api-key',
      );

      // Assert
      expect(result).toEqual({
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: { id: 1, name: 'Test User' },
        duration: expect.any(Number),
        originalRequest: {
          id: 'test-request-id',
          method: 'GET',
          endpoint: 'https://api.example.com/users/1',
          timestamp: new Date('2025-07-10T10:30:00Z'),
          duration: 120,
        },
        replayTimestamp: expect.any(String),
      });
    });

    it('should throw UnauthorizedException for invalid request', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.replayRequest('invalid-id', 'api-key'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw InternalServerErrorException on execution error', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockRequest);
      mockApiKeysService.verifyApiKey.mockResolvedValue(true);
      mockAxiosService.request.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(
        service.replayRequest('test-request-id', 'valid-api-key'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findValidRequest', () => {
    it('should return request for valid API key', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockRequest);
      mockApiKeysService.verifyApiKey.mockResolvedValue(true);

      // Act
      const result = await service.findValidRequest(
        'valid-api-key',
        'test-request-id',
      );

      // Assert
      expect(result).toEqual(mockRequest);
      expect(mockApiKeysService.verifyApiKey).toHaveBeenCalledWith(
        'test-user-id',
        'valid-api-key',
      );
    });

    it('should return null for invalid API key', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockRequest);
      mockApiKeysService.verifyApiKey.mockResolvedValue(false);

      // Act
      const result = await service.findValidRequest(
        'invalid-api-key',
        'test-request-id',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for non-existent request', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findValidRequest(
        'api-key',
        'non-existent-id',
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('makeReplayRequest', () => {
    it('should sanitize headers and make request', async () => {
      // Arrange
      const headers = { authorization: 'Bearer token', host: 'example.com' };
      mockAxiosService.warmConnection.mockResolvedValue(undefined);
      mockAxiosService.request.mockImplementation(async () => {
        // Add small delay to simulate real request timing
        await new Promise((resolve) => setTimeout(resolve, 1));
        return mockAxiosResponse;
      });

      // Act
      const result = await service['makeReplayRequest'](
        'GET',
        'https://api.example.com',
        headers,
      );

      // Assert
      expect(result.response).toEqual(mockAxiosResponse);
      expect(result.duration).toBeGreaterThanOrEqual(0); // Allow 0 for mocked tests
      expect(mockAxiosService.request).toHaveBeenCalledWith({
        method: 'get',
        url: 'https://api.example.com',
        headers: { authorization: 'Bearer token' }, // 'host' should be removed
      });
    });
  });
});
