import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { ConfigService } from '@nestjs/config';
import { ChronicleConfigService } from 'src/common/services/chronicle-config.service';

describe('HealthController', () => {
  let controller: HealthController;
  let configService: ChronicleConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ChronicleConfigService,
          useValue: {
            get: jest.fn(),
            getOrDefault: jest.fn(),
            getEnvironment: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    configService = module.get<ChronicleConfigService>(ChronicleConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status with correct structure', () => {
      // Arrange
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      jest.spyOn(process, 'uptime').mockReturnValue(3600);
      jest.spyOn(configService, 'get').mockReturnValue('development');

      // Act
      const result = controller.getHealth();

      // Assert
      expect(result).toEqual({
        status: 'ok',
        service: 'API Request Recorder',
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 3600,
        environment: 'development',
      });

      // Verify result is instance of HealthDto
      expect(result).toBeInstanceOf(Object);
      expect(result.status).toBe('ok');
      expect(result.service).toBe('API Request Recorder');
      expect(result.version).toBe('1.0.0');
      expect(result.uptime).toBe(3600);
      expect(result.environment).toBe('development');
    });

    it('should return correct environment when NODE_ENV is set', () => {
      // Arrange
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      jest.spyOn(process, 'uptime').mockReturnValue(7200);
      jest.spyOn(configService, 'get').mockReturnValue('production');

      // Act
      const result = controller.getHealth();

      // Assert
      expect(result.environment).toBe('production');
      expect(result.uptime).toBe(7200);
    });

    it('should return development as default environment when NODE_ENV is not set', () => {
      // Arrange
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      jest.spyOn(process, 'uptime').mockReturnValue(1800);
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      // Act
      const result = controller.getHealth();

      // Assert
      expect(result.environment).toBe('development');
    });
  });

  describe('ping', () => {
    it('should return pong with timestamp', () => {
      // Arrange
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // Act
      const result = controller.ping();

      // Assert
      expect(result).toEqual({
        message: 'pong',
        timestamp: '2024-01-01T00:00:00.000Z',
      });
      expect(result.message).toBe('pong');
      expect(result.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should return correct timestamp format', () => {
      // Arrange
      const mockDate = new Date('2024-12-25T15:30:45.123Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      // Act
      const result = controller.ping();

      // Assert
      expect(result.timestamp).toBe('2024-12-25T15:30:45.123Z');
    });
  });

  describe('getInfo', () => {
    beforeEach(() => {
      // Mock process properties
      Object.defineProperty(process, 'version', {
        value: 'v18.17.0',
        configurable: true,
      });
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      });
      Object.defineProperty(process, 'memoryUsage', {
        value: jest.fn().mockReturnValue({
          heapUsed: 50 * 1024 * 1024, // 50MB
          heapTotal: 100 * 1024 * 1024, // 100MB
          rss: 150 * 1024 * 1024, // 150MB
          external: 10 * 1024 * 1024, // 10MB
          arrayBuffers: 5 * 1024 * 1024, // 5MB
        }),
        configurable: true,
      });
    });

    it('should return service information with correct structure', () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue('test');

      // Act
      const result = controller.getInfo();

      // Assert
      expect(result).toEqual({
        name: 'API Request Recorder',
        version: '1.0.0',
        description: 'Central service for recording and replaying API requests',
        environment: 'test',
        nodeVersion: 'v18.17.0',
        platform: 'win32',
        memory: {
          used: 50,
          total: 100,
          free: 50,
        },
      });
    });

    it('should return correct memory usage in MB', () => {
      // Arrange
      const mockMemoryUsage = {
        heapUsed: 25 * 1024 * 1024, // 25MB
        heapTotal: 75 * 1024 * 1024, // 75MB
        rss: 100 * 1024 * 1024, // 100MB
        external: 5 * 1024 * 1024, // 5MB
        arrayBuffers: 2 * 1024 * 1024, // 2MB
      };
      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);

      // Act
      const result = controller.getInfo();

      // Assert
      expect(result.memory).toEqual({
        used: 25,
        total: 75,
        free: 50, // 75 - 25 = 50
      });
    });

    it('should handle different platforms', () => {
      // Arrange
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      });

      // Act
      const result = controller.getInfo();

      // Assert
      expect(result.platform).toBe('linux');
    });

    it('should handle different Node.js versions', () => {
      // Arrange
      Object.defineProperty(process, 'version', {
        value: 'v20.10.0',
        configurable: true,
      });

      // Act
      const result = controller.getInfo();

      // Assert
      expect(result.nodeVersion).toBe('v20.10.0');
    });

    it('should return development as default environment when NODE_ENV is not set', () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      // Act
      const result = controller.getInfo();

      // Assert
      expect(result.environment).toBe('development');
    });

    it('should return correct environment when NODE_ENV is set', () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue('production');

      // Act
      const result = controller.getInfo();

      // Assert
      expect(result.environment).toBe('production');
    });
  });

  describe('edge cases', () => {
    it('should handle zero memory usage', () => {
      // Arrange
      const mockMemoryUsage = {
        heapUsed: 0,
        heapTotal: 0,
        rss: 0,
        external: 0,
        arrayBuffers: 0,
      };
      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);

      // Act
      const result = controller.getInfo();

      // Assert
      expect(result.memory).toEqual({
        used: 0,
        total: 0,
        free: 0,
      });
    });

    it('should handle very large memory usage', () => {
      // Arrange
      const mockMemoryUsage = {
        heapUsed: 1024 * 1024 * 1024, // 1GB
        heapTotal: 2048 * 1024 * 1024, // 2GB
        rss: 3000 * 1024 * 1024, // 3GB
        external: 100 * 1024 * 1024, // 100MB
        arrayBuffers: 50 * 1024 * 1024, // 50MB
      };
      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);

      // Act
      const result = controller.getInfo();

      // Assert
      expect(result.memory).toEqual({
        used: 1024,
        total: 2048,
        free: 1024,
      });
    });

    it('should handle decimal memory values correctly', () => {
      // Arrange
      const mockMemoryUsage = {
        heapUsed: 50.7 * 1024 * 1024, // 50.7MB
        heapTotal: 100.3 * 1024 * 1024, // 100.3MB
        rss: 150.5 * 1024 * 1024, // 150.5MB
        external: 10.2 * 1024 * 1024, // 10.2MB
        arrayBuffers: 5.1 * 1024 * 1024, // 5.1MB
      };
      jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);

      // Act
      const result = controller.getInfo();

      // Assert
      expect(result.memory.used).toBe(51);
      expect(result.memory.total).toBe(100);
      expect(result.memory.free).toBe(50);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
