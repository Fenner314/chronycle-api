import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    email: 'test@example.com',
    firstName: overrides.firstName || 'John',
    lastName: overrides.lastName || 'Doe',
    password: 'hashedPassword123',
    isActive: true,
    isEmailVerified: true,
    emailVerificationToken: '',
    passwordResetToken: '',
    passwordResetExpires: new Date(),
    apiKeys: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    fullName: overrides.fullName || 'John Doe',
    ...overrides,
  });

  const mockUsersService = {
    validateUser: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'correctPassword123';
      const mockUser = createMockUser({ email });

      usersService.validateUser.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(usersService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should return null when credentials are invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongPassword';

      usersService.validateUser.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(usersService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toBeNull();
    });

    it('should return null when user does not exist', async () => {
      const email = 'nonexistent@example.com';
      const password = 'anyPassword';

      usersService.validateUser.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(usersService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toBeNull();
    });

    it('should handle users service errors', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const error = new Error('Database connection failed');

      usersService.validateUser.mockRejectedValue(error);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'correctPassword123',
      };

      const mockUser = createMockUser({ email: loginDto.email });
      const mockToken = 'jwt-token-123';

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(service.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          fullName: mockUser.fullName || '',
        },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(service.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle different user data in login', async () => {
      const loginDto: LoginDto = {
        email: 'jane@example.com',
        password: 'janePassword123',
      };

      const mockUser = createMockUser({
        id: 'user-2',
        email: loginDto.email,
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane Smith',
      });
      const mockToken = 'jwt-token-456';

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(result.access_token).toBe(mockToken);
      expect(result.user.firstName).toBe('Jane');
      expect(result.user.lastName).toBe('Smith');
      expect(result.user.fullName).toBe('Jane Smith');
    });

    it('should create correct JWT payload', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = createMockUser({
        id: 'specific-user-id',
        email: loginDto.email,
      });

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('token');

      await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
    });

    it('should propagate validateUser errors', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const error = new Error('Service unavailable');
      jest.spyOn(service, 'validateUser').mockRejectedValue(error);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Service unavailable',
      );
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
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
        fullName: 'John Doe',
      }) as Omit<User, 'password'> & { fullName: string };
      const mockToken = 'jwt-token-789';

      usersService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          fullName: mockUser.fullName,
        },
      });
    });

    it('should handle registration with different user data', async () => {
      const registerDto: RegisterDto = {
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        password: 'alicePassword456',
      };

      const mockUser = createMockUser({
        id: 'user-3',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        fullName: registerDto.firstName + ' ' + registerDto.lastName,
      }) as Omit<User, 'password'> & { fullName: string };
      const mockToken = 'jwt-token-alice';

      usersService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.register(registerDto);

      expect(result.access_token).toBe(mockToken);
      expect(result.user.firstName).toBe('Alice');
      expect(result.user.lastName).toBe('Johnson');
      expect(result.user.fullName).toBe('Alice Johnson');
    });

    it('should create correct JWT payload for registration', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      const mockUser = createMockUser({
        id: 'registration-user-id',
        email: registerDto.email,
      }) as Omit<User, 'password'> & { fullName: string };

      usersService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('token');

      await service.register(registerDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
    });

    it('should propagate user creation errors', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      const error = new ConflictException(
        'User with this email already exists',
      );
      usersService.create.mockRejectedValue(error);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle JWT signing errors', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      const mockUser = createMockUser({
        email: registerDto.email,
      }) as Omit<User, 'password'> & { fullName: string };
      const error = new Error('JWT signing failed');

      usersService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockImplementation(() => {
        throw error;
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        'JWT signing failed',
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const userId = 'user-1';
      const mockUser = createMockUser({ id: userId });

      usersService.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should handle different user IDs', async () => {
      const userId = 'different-user-123';
      const mockUser = createMockUser({
        id: userId,
        email: 'different@example.com',
        firstName: 'Different',
        lastName: 'User',
      });

      usersService.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(result.firstName).toBe('Different');
      expect(result.id).toBe(userId);
    });

    it('should propagate user not found errors', async () => {
      const userId = 'nonexistent-user';
      const error = new Error('User not found');

      usersService.findOne.mockRejectedValue(error);

      await expect(service.getProfile(userId)).rejects.toThrow(
        'User not found',
      );
      expect(usersService.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('JWT token generation', () => {
    it('should generate consistent JWT payload structure', async () => {
      const testCases = [
        { id: 'user-1', email: 'test1@example.com' },
        { id: 'user-2', email: 'test2@example.com' },
        { id: 'user-3', email: 'test3@example.com' },
      ];

      for (const testCase of testCases) {
        const mockUser = createMockUser(testCase) as Omit<User, 'password'> & {
          fullName: string;
        };
        const registerDto: RegisterDto = {
          email: testCase.email,
          firstName: 'Test',
          lastName: 'User',
          password: 'password123',
        };

        usersService.create.mockResolvedValue(mockUser);
        jwtService.sign.mockReturnValue('token');

        await service.register(registerDto);

        expect(jwtService.sign).toHaveBeenCalledWith({
          email: testCase.email,
          sub: testCase.id,
        });
      }
    });
  });

  describe('user data transformation', () => {
    it('should transform user data consistently in login and register', async () => {
      const mockUser = createMockUser({
        id: 'user-123',
        email: 'transform@example.com',
        firstName: 'Transform',
        lastName: 'Test',
      });

      // Test login transformation
      const loginDto: LoginDto = {
        email: mockUser.email,
        password: 'password123',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('token');

      const loginResult = await service.login(loginDto);

      // Test register transformation
      const registerDto: RegisterDto = {
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        password: 'password123',
      };

      usersService.create.mockResolvedValue(
        mockUser as Omit<User, 'password'> & { fullName: string },
      );
      const registerResult = await service.register(registerDto);

      // Both should have the same user data structure
      expect(loginResult.user).toEqual(registerResult.user);
      expect(loginResult.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        fullName: mockUser.fullName || '',
      });
    });
  });

  describe('error handling', () => {
    it('should handle various error types in validateUser', async () => {
      const errors = [
        new Error('Network error'),
        new Error('Database timeout'),
        new UnauthorizedException('Account locked'),
      ];

      for (const error of errors) {
        usersService.validateUser.mockRejectedValue(error);
        await expect(
          service.validateUser('test@example.com', 'password'),
        ).rejects.toThrow(error);
      }
    });

    it('should handle various error types in register', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      const errors = [
        new ConflictException('Email already exists'),
        new Error('Validation failed'),
        new Error('Database constraint violation'),
      ];

      for (const error of errors) {
        usersService.create.mockRejectedValue(error);
        await expect(service.register(registerDto)).rejects.toThrow(error);
      }
    });
  });
});
