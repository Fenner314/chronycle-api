import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
import { RecordingService } from './recording.service';
import { RecordRequestDto } from './dto/record-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtRequest } from 'src/auth/dto/jwt-request.dto';

@ApiTags('Recording')
@Controller('api/v1/recording')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecordingController {
  constructor(private readonly recordingService: RecordingService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new request' })
  @ApiResponse({ status: 201, description: 'Request recorded successfully' })
  async recordRequest(
    @Request() req: JwtRequest,
    @Body() recordRequestDto: RecordRequestDto,
  ) {
    return await this.recordingService.recordRequest(
      req.user.id,
      recordRequestDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all recorded requests for current user' })
  async findAll(@Request() req: JwtRequest) {
    return await this.recordingService.findAllByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific recorded request' })
  async findOne(@Param('id') id: string, @Request() req: JwtRequest) {
    return await this.recordingService.findOne(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recorded request' })
  async remove(@Param('id') id: string, @Request() req: JwtRequest) {
    await this.recordingService.remove(id, req.user.id);
    return { message: 'Request deleted successfully' };
  }

  @Get(':apiId/requests')
  @ApiOperation({ summary: 'Get recorded requests for an API' })
  async getRecordedRequests(
    @Param('apiId') apiId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Query('endpoint') endpoint?: string,
    @Query('method') method?: string,
    // @Request() req: JwtRequest,
  ) {
    return await this.recordingService.getRecordedRequests(
      apiId,
      limit,
      offset,
      endpoint,
      method,
      // req.user.id,
    );
  }

  @Get(':apiId/stats')
  @ApiOperation({ summary: 'Get request statistics for an API' })
  async getRequestStats(
    @Param('apiId') apiId: string,
    // @Request() req: JwtRequest,
  ): Promise<any> {
    return await this.recordingService.getRequestStats(
      apiId,
      // req.user.id
    );
  }
}
