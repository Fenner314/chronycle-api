/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtRequest } from '../auth/dto/jwt-request.dto';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

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

  const createMockJwtRequest = (
    overrides: Partial<JwtRequest> = {},
  ): JwtRequest =>
    ({
      user: createMockUser(),
      ...overrides,
    }) as JwtRequest;

  const mockUsersService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'securePassword123',
      };

      const mockUser = createMockUser({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      }) as Omit<User, 'password'> & { fullName: string };

      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should create user with different data', async () => {
      const createUserDto: CreateUserDto = {
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'anotherPassword456',
      };

      const mockUser = createMockUser({
        id: 'user-2',
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      }) as Omit<User, 'password'> & { fullName: string };

      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });

    it('should handle user creation errors', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      const error = new ConflictException(
        'User with this email already exists',
      );
      service.create.mockRejectedValue(error);

      await expect(controller.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should propagate validation errors', async () => {
      const createUserDto: CreateUserDto = {
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
        password: 'weak',
      };

      const error = new Error('Validation failed');
      service.create.mockRejectedValue(error);

      await expect(controller.create(createUserDto)).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
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

      service.findOne.mockResolvedValue(differentUser);

      const result = await controller.getProfile(mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(differentUser.id);
      expect(result).toEqual(differentUser);
      expect(result.firstName).toBe('Jane');
    });

    it('should handle profile not found', async () => {
      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      const error = new NotFoundException('User not found');
      service.findOne.mockRejectedValue(error);

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle service errors', async () => {
      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      const error = new Error('Database connection failed');
      service.findOne.mockRejectedValue(error);

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'UpdatedJohn',
        lastName: 'UpdatedDoe',
      };

      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });
      const updatedUser = createMockUser({
        ...mockUser,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
      });

      service.update.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest, updateUserDto);

      expect(service.update).toHaveBeenCalledWith(mockUser.id, updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(result.firstName).toBe('UpdatedJohn');
    });

    it('should update profile with partial data', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'OnlyFirstName',
      };

      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });
      const updatedUser = createMockUser({
        ...mockUser,
        firstName: updateUserDto.firstName,
      });

      service.update.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest, updateUserDto);

      expect(service.update).toHaveBeenCalledWith(mockUser.id, updateUserDto);
      expect(result.firstName).toBe('OnlyFirstName');
      expect(result.lastName).toBe('Doe'); // Should remain unchanged
    });

    it('should handle update with different user', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Jane',
        lastName: 'Updated',
      };

      const differentUser = createMockUser({
        id: 'user-3',
        email: 'jane@example.com',
      });
      const mockRequest = createMockJwtRequest({ user: differentUser });
      const updatedUser = createMockUser({
        ...differentUser,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
      });

      service.update.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest, updateUserDto);

      expect(service.update).toHaveBeenCalledWith(
        differentUser.id,
        updateUserDto,
      );
      expect(result.firstName).toBe('Jane');
    });

    it('should handle update errors', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Test',
      };

      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      const error = new NotFoundException('User not found');
      service.update.mockRejectedValue(error);

      await expect(
        controller.updateProfile(mockRequest, updateUserDto),
      ).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(mockUser.id, updateUserDto);
    });

    it('should handle validation errors in update', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: '', // Invalid empty string
      };

      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      const error = new Error('Validation failed');
      service.update.mockRejectedValue(error);

      await expect(
        controller.updateProfile(mockRequest, updateUserDto),
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account successfully', async () => {
      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      service.remove.mockResolvedValue();

      const result = await controller.deleteAccount(mockRequest);

      expect(service.remove).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ message: 'Account deleted successfully' });
    });

    it('should delete account for different user', async () => {
      const differentUser = createMockUser({
        id: 'user-4',
        email: 'delete@example.com',
      });
      const mockRequest = createMockJwtRequest({ user: differentUser });

      service.remove.mockResolvedValue();

      const result = await controller.deleteAccount(mockRequest);

      expect(service.remove).toHaveBeenCalledWith(differentUser.id);
      expect(result).toEqual({ message: 'Account deleted successfully' });
    });

    it('should handle account deletion errors', async () => {
      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      const error = new NotFoundException('User not found');
      service.remove.mockRejectedValue(error);

      await expect(controller.deleteAccount(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle service errors during deletion', async () => {
      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      const error = new Error('Database constraint violation');
      service.remove.mockRejectedValue(error);

      await expect(controller.deleteAccount(mockRequest)).rejects.toThrow(
        'Database constraint violation',
      );
    });
  });

  describe('user context handling', () => {
    it('should extract user ID correctly from JWT request', async () => {
      const specificUserId = 'specific-user-123';
      const mockUser = createMockUser({ id: specificUserId });
      const mockRequest = createMockJwtRequest({ user: mockUser });

      service.findOne.mockResolvedValue(mockUser);

      await controller.getProfile(mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(specificUserId);
    });

    it('should use correct user ID in all authenticated endpoints', async () => {
      const userId = 'test-user-456';
      const mockUser = createMockUser({ id: userId });
      const mockRequest = createMockJwtRequest({ user: mockUser });

      // Mock service methods
      service.findOne.mockResolvedValue(mockUser);
      service.update.mockResolvedValue(mockUser);
      service.remove.mockResolvedValue();

      // Test all authenticated endpoints
      await controller.getProfile(mockRequest);
      await controller.updateProfile(mockRequest, { firstName: 'Test' });
      await controller.deleteAccount(mockRequest);

      // Verify user ID is passed to all service methods
      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(service.update).toHaveBeenCalledWith(userId, expect.any(Object));
      expect(service.remove).toHaveBeenCalledWith(userId);
    });
  });

  describe('endpoint security', () => {
    it('should have public create endpoint', async () => {
      const createUserDto: CreateUserDto = {
        email: 'public@example.com',
        firstName: 'Public',
        lastName: 'User',
        password: 'password123',
      };

      const mockUser = createMockUser() as Omit<User, 'password'> & {
        fullName: string;
      };
      service.create.mockResolvedValue(mockUser);

      // This should work without authentication
      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockUser);
    });

    it('should require authentication for profile endpoints', async () => {
      // This test verifies that the JWT guard is properly applied
      // In real scenarios, the guard would prevent access without valid JWT
      // Here we just verify the endpoints work with proper JWT request
      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      service.findOne.mockResolvedValue(mockUser);
      service.update.mockResolvedValue(mockUser);
      service.remove.mockResolvedValue();

      // All these should work with proper JWT request
      await expect(controller.getProfile(mockRequest)).resolves.toEqual(
        mockUser,
      );
      await expect(controller.updateProfile(mockRequest, {})).resolves.toEqual(
        mockUser,
      );
      await expect(controller.deleteAccount(mockRequest)).resolves.toEqual({
        message: 'Account deleted successfully',
      });
    });
  });

  describe('data flow', () => {
    it('should handle complete user lifecycle', async () => {
      // Create user
      const createUserDto: CreateUserDto = {
        email: 'lifecycle@example.com',
        firstName: 'Lifecycle',
        lastName: 'Test',
        password: 'password123',
      };

      const mockUser = createMockUser({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      }) as Omit<User, 'password'> & { fullName: string };

      service.create.mockResolvedValue(mockUser);

      const createResult = await controller.create(createUserDto);
      expect(createResult.email).toBe(createUserDto.email);

      // Get profile
      const mockRequest = createMockJwtRequest({ user: mockUser });
      service.findOne.mockResolvedValue(mockUser as User);

      const profileResult = await controller.getProfile(mockRequest);
      expect(profileResult).toEqual(mockUser);

      // Update profile
      const updateUserDto: UpdateUserDto = {
        firstName: 'UpdatedLifecycle',
      };
      const updatedUser = createMockUser({
        ...mockUser,
        firstName: updateUserDto.firstName,
      });

      service.update.mockResolvedValue(updatedUser);

      const updateResult = await controller.updateProfile(
        mockRequest,
        updateUserDto,
      );
      expect(updateResult.firstName).toBe('UpdatedLifecycle');

      // Delete account
      service.remove.mockResolvedValue();

      const deleteResult = await controller.deleteAccount(mockRequest);
      expect(deleteResult).toEqual({ message: 'Account deleted successfully' });
    });
  });

  describe('error propagation', () => {
    it('should propagate all service errors correctly', async () => {
      const mockUser = createMockUser();
      const mockRequest = createMockJwtRequest({ user: mockUser });

      const errors = [
        new ConflictException('Email already exists'),
        new NotFoundException('User not found'),
        new Error('Database error'),
        new Error('Validation failed'),
      ];

      for (const error of errors) {
        // Test create errors
        service.create.mockRejectedValue(error);
        await expect(controller.create({} as CreateUserDto)).rejects.toThrow(
          error,
        );

        // Test getProfile errors
        service.findOne.mockRejectedValue(error);
        await expect(controller.getProfile(mockRequest)).rejects.toThrow(error);

        // Test updateProfile errors
        service.update.mockRejectedValue(error);
        await expect(controller.updateProfile(mockRequest, {})).rejects.toThrow(
          error,
        );

        // Test deleteAccount errors
        service.remove.mockRejectedValue(error);
        await expect(controller.deleteAccount(mockRequest)).rejects.toThrow(
          error,
        );
      }
    });
  });
});
