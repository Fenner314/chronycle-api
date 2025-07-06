import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtRequest } from 'src/auth/dto/jwt-request.dto';
import { ApiKeyUsageStats } from './types/api-key-usage-stats.interface';

@ApiTags('API Keys')
@Controller('api/v1/api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  async create(
    @Request() req: JwtRequest,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return await this.apiKeysService.create(req.user.id, createApiKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys for current user' })
  async findAll(@Request() req: JwtRequest) {
    return await this.apiKeysService.findAllByUser(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get API key usage statistics' })
  async getStats(@Request() req: JwtRequest): Promise<ApiKeyUsageStats> {
    return await this.apiKeysService.getUsageStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific API key' })
  async findOne(@Param('id') id: string, @Request() req: JwtRequest) {
    return await this.apiKeysService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an API key' })
  async update(
    @Param('id') id: string,
    @Request() req: JwtRequest,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
  ) {
    return await this.apiKeysService.update(id, req.user.id, updateApiKeyDto);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate an API key' })
  async deactivate(@Param('id') id: string, @Request() req: JwtRequest) {
    return await this.apiKeysService.deactivate(id, req.user.id);
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate an API key' })
  async regenerate(@Param('id') id: string, @Request() req: JwtRequest) {
    return await this.apiKeysService.regenerate(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API key' })
  async remove(@Param('id') id: string, @Request() req: JwtRequest) {
    await this.apiKeysService.remove(id, req.user.id);
    return { message: 'API key deleted successfully' };
  }
}
