import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtRequest } from './dto/jwt-request.dto';
import { User } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

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

  const createMockAuthResponse = (user: User) => ({
    access_token: 'jwt-token-123',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName || '',
    },
  });

  const createMockJwtRequest = (
    overrides: Partial<JwtRequest> = {},
  ): JwtRequest =>
    ({
      user: createMockUser(),
      ...overrides,
    }) as JwtRequest;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'securePassword123',
      };

      const mockUser = createMockUser({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });

      const mockResponse = createMockAuthResponse(mockUser);
      service.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBe('jwt-token-123');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should handle registration with different user data', async () => {
      const registerDto: RegisterDto = {
        email: 'different@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'anotherPassword456',
      };

      const mockUser = createMockUser({
        id: 'user-2',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });

      const mockResponse = createMockAuthResponse(mockUser);
      service.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResponse);
      expect(result.user.firstName).toBe('Jane');
      expect(result.user.lastName).toBe('Smith');
    });

    it('should handle registration errors', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      const error = new ConflictException(
        'User with this email already exists',
      );
      service.register.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'correctPassword123',
      };

      const mockUser = createMockUser({ email: loginDto.email });
      const mockResponse = createMockAuthResponse(mockUser);
      service.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBe('jwt-token-123');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should handle login with different credentials', async () => {
      const loginDto: LoginDto = {
        email: 'another@example.com',
        password: 'differentPassword456',
      };

      const mockUser = createMockUser({
        id: 'user-3',
        email: loginDto.email,
        firstName: 'Different',
        lastName: 'User',
      });

      const mockResponse = createMockAuthResponse(mockUser);
      service.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResponse);
      expect(result.user.firstName).toBe('Different');
    });

    it('should handle invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      const error = new UnauthorizedException('Invalid credentials');
      service.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle non-existent user', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'anyPassword',
      };

      const error = new UnauthorizedException('Invalid credentials');
      service.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      service.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest);

      expect(service.getProfile).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should return profile for different user', async () => {
      const differentUser = createMockUser({
        id: 'user-2',
        email: 'different@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      });
      const mockRequest = createMockJwtRequest({ user: differentUser });

      service.getProfile.mockResolvedValue(differentUser);

      const result = await controller.getProfile(mockRequest);

      expect(service.getProfile).toHaveBeenCalledWith(differentUser.id);
      expect(result).toEqual(differentUser);
      expect(result.firstName).toBe('Jane');
    });

    it('should handle profile not found', async () => {
      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      const error = new UnauthorizedException('User not found');
      service.getProfile.mockRejectedValue(error);

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.getProfile).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('authentication flow', () => {
    it('should handle complete register -> login -> profile flow', async () => {
      // Register
      const registerDto: RegisterDto = {
        email: 'flowtest@example.com',
        firstName: 'Flow',
        lastName: 'Test',
        password: 'flowPassword123',
      };

      const mockUser = createMockUser({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });

      const mockAuthResponse = createMockAuthResponse(mockUser);
      service.register.mockResolvedValue(mockAuthResponse);

      const registerResult = await controller.register(registerDto);
      expect(registerResult.access_token).toBe('jwt-token-123');

      // Login
      const loginDto: LoginDto = {
        email: registerDto.email,
        password: registerDto.password,
      };

      service.login.mockResolvedValue(mockAuthResponse);

      const loginResult = await controller.login(loginDto);
      expect(loginResult.access_token).toBe('jwt-token-123');

      // Profile
      const mockRequest = createMockJwtRequest({ user: mockUser });
      service.getProfile.mockResolvedValue(mockUser);

      const profileResult = await controller.getProfile(mockRequest);
      expect(profileResult.email).toBe(registerDto.email);
    });
  });

  describe('input validation', () => {
    it('should handle register with minimal required fields', async () => {
      const registerDto: RegisterDto = {
        email: 'minimal@example.com',
        firstName: 'Min',
        lastName: 'User',
        password: 'minPassword123',
      };

      const mockUser = createMockUser({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });

      const mockResponse = createMockAuthResponse(mockUser);
      service.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result.user.firstName).toBe('Min');
    });

    it('should handle login with email and password only', async () => {
      const loginDto: LoginDto = {
        email: 'simple@example.com',
        password: 'simplePassword123',
      };

      const mockUser = createMockUser({ email: loginDto.email });
      const mockResponse = createMockAuthResponse(mockUser);
      service.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result.user.email).toBe(loginDto.email);
    });
  });

  describe('error propagation', () => {
    it('should propagate all register errors', async () => {
      const registerDto: RegisterDto = {
        email: 'error@example.com',
        firstName: 'Error',
        lastName: 'User',
        password: 'errorPassword123',
      };

      const errors = [
        new ConflictException('Email already exists'),
        new Error('Database connection failed'),
        new Error('Validation failed'),
      ];

      for (const error of errors) {
        service.register.mockRejectedValue(error);
        await expect(controller.register(registerDto)).rejects.toThrow(error);
      }
    });

    it('should propagate all login errors', async () => {
      const loginDto: LoginDto = {
        email: 'error@example.com',
        password: 'errorPassword',
      };

      const errors = [
        new UnauthorizedException('Invalid credentials'),
        new Error('Service unavailable'),
        new Error('Rate limit exceeded'),
      ];

      for (const error of errors) {
        service.login.mockRejectedValue(error);
        await expect(controller.login(loginDto)).rejects.toThrow(error);
      }
    });

    it('should propagate all profile errors', async () => {
      const mockRequest = createMockJwtRequest();

      const errors = [
        new UnauthorizedException('Token expired'),
        new Error('User not found'),
        new Error('Database error'),
      ];

      for (const error of errors) {
        service.getProfile.mockRejectedValue(error);
        await expect(controller.getProfile(mockRequest)).rejects.toThrow(error);
      }
    });
  });

  describe('user context extraction', () => {
    it('should extract user ID correctly from JWT request', async () => {
      const specificUserId = 'specific-user-123';
      const mockUser = createMockUser({ id: specificUserId });
      const mockRequest = createMockJwtRequest({ user: mockUser });

      service.getProfile.mockResolvedValue(mockUser);

      await controller.getProfile(mockRequest);

      expect(service.getProfile).toHaveBeenCalledWith(specificUserId);
    });

    it('should handle different user IDs in JWT', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      for (const userId of userIds) {
        const mockUser = createMockUser({ id: userId });
        const mockRequest = createMockJwtRequest({ user: mockUser });

        service.getProfile.mockResolvedValue(mockUser);

        await controller.getProfile(mockRequest);

        expect(service.getProfile).toHaveBeenCalledWith(userId);
      }
    });
  });
});
