import { Test, TestingModule } from '@nestjs/testing';
import { ReplayController } from './replay.controller';
import { ReplayService } from './replay.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ReplayRequestDto } from './dto/replay-request.dto';
import {
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ReplayRequestResponse } from './types/replay-request-response.interface';

describe('ReplayController', () => {
  let controller: ReplayController;

  const mockReplayService = {
    replayRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReplayController],
      providers: [
        {
          provide: ReplayService,
          useValue: mockReplayService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReplayController>(ReplayController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('replayRequest', () => {
    const mockRequestDto: ReplayRequestDto = {
      id: 'test-request-id-123',
    };

    const mockApiKey = 'test-api-key-456';

    const mockReplayResponse = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'x-custom-header': 'test-value',
      },
      body: {
        message: 'Success',
        data: { id: 1, name: 'Test' },
      },
      duration: 150,
      originalRequest: {
        id: 'test-request-id-123',
        method: 'GET',
        endpoint: 'https://api.example.com/users/1',
        timestamp: '2025-07-10T10:30:00Z',
        duration: 120,
      },
      replayTimestamp: '2025-07-10T12:00:00Z',
    };

    it('should replay a request successfully', async () => {
      // Arrange
      mockReplayService.replayRequest.mockResolvedValue(mockReplayResponse);

      // Act
      const result = await controller.replayRequest(mockRequestDto, mockApiKey);

      // Assert
      expect(result).toEqual(mockReplayResponse);
      expect(mockReplayService.replayRequest).toHaveBeenCalledWith(
        mockRequestDto.id,
        mockApiKey,
      );
      expect(mockReplayService.replayRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle UnauthorizedException from service', async () => {
      // Arrange
      const errorMessage = 'Invalid API key or request not found';
      mockReplayService.replayRequest.mockRejectedValue(
        new UnauthorizedException(errorMessage),
      );

      // Act & Assert
      await expect(
        controller.replayRequest(mockRequestDto, mockApiKey),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockReplayService.replayRequest).toHaveBeenCalledWith(
        mockRequestDto.id,
        mockApiKey,
      );
    });

    it('should handle InternalServerErrorException from service', async () => {
      // Arrange
      const errorMessage = 'Failed to replay request: Network error';
      mockReplayService.replayRequest.mockRejectedValue(
        new InternalServerErrorException(errorMessage),
      );

      // Act & Assert
      await expect(
        controller.replayRequest(mockRequestDto, mockApiKey),
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockReplayService.replayRequest).toHaveBeenCalledWith(
        mockRequestDto.id,
        mockApiKey,
      );
    });

    it('should handle generic errors from service', async () => {
      // Arrange
      const errorMessage = 'Unexpected error occurred';
      mockReplayService.replayRequest.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(
        controller.replayRequest(mockRequestDto, mockApiKey),
      ).rejects.toThrow(Error);

      expect(mockReplayService.replayRequest).toHaveBeenCalledWith(
        mockRequestDto.id,
        mockApiKey,
      );
    });

    it('should pass the correct parameters to service', async () => {
      // Arrange
      const customRequestDto: ReplayRequestDto = {
        id: 'custom-request-id-789',
      };
      const customApiKey = 'custom-api-key-abc';

      mockReplayService.replayRequest.mockResolvedValue(mockReplayResponse);

      // Act
      await controller.replayRequest(customRequestDto, customApiKey);

      // Assert
      expect(mockReplayService.replayRequest).toHaveBeenCalledWith(
        customRequestDto.id,
        customApiKey,
      );
    });

    it('should handle replay response with different status codes', async () => {
      // Arrange
      const errorReplayResponse = {
        statusCode: 404,
        headers: {
          'content-type': 'application/json',
        },
        body: {
          error: 'Resource not found',
        },
        duration: 85,
        originalRequest: {
          id: 'test-request-id-123',
          method: 'GET',
          endpoint: 'https://api.example.com/users/999',
          timestamp: '2025-07-10T10:30:00Z',
          duration: 90,
        },
        replayTimestamp: '2025-07-10T12:00:00Z',
      };

      mockReplayService.replayRequest.mockResolvedValue(errorReplayResponse);

      // Act
      const result: ReplayRequestResponse = await controller.replayRequest(
        mockRequestDto,
        mockApiKey,
      );

      // Assert
      expect(result).toEqual(errorReplayResponse);
      expect(result.statusCode).toBe(404);
    });

    it('should handle replay response with timing information', async () => {
      // Arrange
      const timedReplayResponse = {
        ...mockReplayResponse,
        duration: 250, // Replay took 250ms
        originalRequest: {
          ...mockReplayResponse.originalRequest,
          duration: 180, // Original request took 180ms
        },
      };

      mockReplayService.replayRequest.mockResolvedValue(timedReplayResponse);

      // Act
      const result: ReplayRequestResponse = await controller.replayRequest(
        mockRequestDto,
        mockApiKey,
      );

      // Assert
      expect(result.duration).toBe(250);
      expect(result.originalRequest.duration).toBe(180);
    });
  });

  describe('Guard Integration', () => {
    it('should be protected by ApiKeyGuard', () => {
      const guards = Reflect.getMetadata('__guards__', ReplayController);
      expect(guards).toContain(ApiKeyGuard);
    });
  });

  describe('Swagger Documentation', () => {
    it('should have correct API tags', () => {
      const tags = Reflect.getMetadata('swagger/apiUseTags', ReplayController);
      expect(tags).toEqual(['Replay']);
    });

    it('should have API security decorator', () => {
      const security = Reflect.getMetadata(
        'swagger/apiSecurity',
        ReplayController,
      );
      expect(security).toBeDefined();
    });

    it('should have correct API operation metadata on replayRequest method', () => {
      const operation = Reflect.getMetadata(
        'swagger/apiOperation',
        controller.replayRequest,
      );
      expect(operation).toEqual({ summary: 'Replay an API request' });
    });

    it('should have correct API response metadata on replayRequest method', () => {
      const responses = Reflect.getMetadata(
        'swagger/apiResponse',
        controller.replayRequest,
      );
      expect(responses).toBeDefined();
    });
  });
});
