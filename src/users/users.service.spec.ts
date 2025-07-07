import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword123',
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

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'plainPassword123',
      };

      const hashedPassword = 'hashedPassword123';
      const mockUser = createMockUser({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        password: hashedPassword,
      });

      repository.findOne.mockResolvedValue(null); // No existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(repository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
        isEmailVerified: mockUser.isEmailVerified,
        emailVerificationToken: mockUser.emailVerificationToken,
        passwordResetToken: mockUser.passwordResetToken,
        passwordResetExpires: mockUser.passwordResetExpires,
        apiKeys: mockUser.apiKeys,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        fullName: 'John Doe',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException when user already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      const existingUser = createMockUser({ email: createUserDto.email });
      repository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'User with this email already exists',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should handle bcrypt hashing errors', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      repository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(service.create(createUserDto)).rejects.toThrow(
        'Hashing failed',
      );
    });

    it('should handle database save errors', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      const mockUser = createMockUser();
      repository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      repository.create.mockReturnValue(mockUser);
      repository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createUserDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAll', () => {
    it('should return all users with relations', async () => {
      const mockUsers = [
        createMockUser(),
        createMockUser({ id: 'user-2', email: 'user2@example.com' }),
      ];

      repository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['apiKeys'],
      });
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      const userId = 'user-1';
      const mockUser = createMockUser({ id: userId });

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['apiKeys'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'nonexistent-user';

      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(userId)).rejects.toThrow('User not found');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const email = 'test@example.com';
      const mockUser = createMockUser({ email });

      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email },
        relations: ['apiKeys'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      const email = 'nonexistent@example.com';

      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = 'user-1';
      const updateUserDto: UpdateUserDto = {
        firstName: 'UpdatedJohn',
        lastName: 'UpdatedDoe',
      };

      const mockUser = createMockUser({ id: userId });
      const updatedUser = createMockUser({
        ...mockUser,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
      });

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(repository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateUserDto,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should update user with partial data', async () => {
      const userId = 'user-1';
      const updateUserDto: UpdateUserDto = {
        firstName: 'OnlyFirstName',
      };

      const mockUser = createMockUser({ id: userId });
      const updatedUser = createMockUser({
        ...mockUser,
        firstName: updateUserDto.firstName,
      });

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(result.firstName).toBe('OnlyFirstName');
      expect(result.lastName).toBe(mockUser.lastName); // Should remain unchanged
    });

    it('should throw NotFoundException when user not found for update', async () => {
      const userId = 'nonexistent-user';
      const updateUserDto: UpdateUserDto = {
        firstName: 'Test',
      };

      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      const userId = 'user-1';
      const mockUser = createMockUser({ id: userId });

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      repository.remove.mockResolvedValue(mockUser);

      await service.remove(userId);

      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(repository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found for removal', async () => {
      const userId = 'nonexistent-user';

      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'plainPassword123';
      const mockUser = createMockUser({ email });

      repository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email },
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'password',
          'isActive',
        ],
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      repository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password is incorrect', async () => {
      const email = 'test@example.com';
      const password = 'wrongPassword';
      const mockUser = createMockUser({ email });

      repository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toBeNull();
    });

    it('should handle bcrypt compare errors', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = createMockUser({ email });

      repository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValue(
        new Error('Bcrypt error'),
      );

      await expect(service.validateUser(email, password)).rejects.toThrow(
        'Bcrypt error',
      );
    });
  });

  describe('returnUserWithoutPassword', () => {
    it('should return user without password and with fullName', () => {
      const mockUser = createMockUser({
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = service.returnUserWithoutPassword(mockUser);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('fullName', 'John Doe');
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('firstName', mockUser.firstName);
      expect(result).toHaveProperty('lastName', mockUser.lastName);
    });

    it('should handle different user names', () => {
      const mockUser = createMockUser({
        firstName: 'Jane',
        lastName: 'Smith',
      });

      const result = service.returnUserWithoutPassword(mockUser);

      expect(result.fullName).toBe('Jane Smith');
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });

    it('should handle empty names', () => {
      const mockUser = createMockUser({
        firstName: '',
        lastName: '',
      });

      const result = service.returnUserWithoutPassword(mockUser);

      expect(result.fullName).toBe(' ');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('password security', () => {
    it('should hash passwords with correct salt rounds', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'plainPassword123',
      };

      const mockUser = createMockUser();
      repository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword123', 10);
    });

    it('should never expose password in create response', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'plainPassword123',
      };

      const mockUser = createMockUser();
      repository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).not.toHaveProperty('password');
      expect(typeof result.fullName).toBe('string');
    });

    it('should select password field only in validateUser', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      repository.findOne.mockResolvedValue(null);

      await service.validateUser(email, password);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email },
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'password',
          'isActive',
        ],
      });
    });
  });

  describe('error handling', () => {
    it('should handle repository errors in create', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      repository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in findAll', async () => {
      repository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow('Database error');
    });

    it('should handle repository errors in findByEmail', async () => {
      repository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.findByEmail('test@example.com')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('data consistency', () => {
    it('should maintain data consistency across operations', async () => {
      const createUserDto: CreateUserDto = {
        email: 'consistency@example.com',
        firstName: 'Consistent',
        lastName: 'User',
        password: 'password123',
      };

      const mockUser = createMockUser({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      });

      // Create
      repository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const createResult = await service.create(createUserDto);

      // Find
      repository.findOne.mockResolvedValue(mockUser);
      const findResult = await service.findOne(mockUser.id);

      // Update
      const updateDto: UpdateUserDto = { firstName: 'Updated' };
      const updatedUser = createMockUser({ ...mockUser, firstName: 'Updated' });
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(updatedUser);

      const updateResult = await service.update(mockUser.id, updateDto);

      expect(createResult.email).toBe(createUserDto.email);
      expect(findResult.email).toBe(createUserDto.email);
      expect(updateResult.firstName).toBe('Updated');
    });
  });
});
