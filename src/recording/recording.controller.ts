import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  // Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { RecordingService } from './recording.service';
import { RecordRequestDto } from './dto/record-request.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
// import { JwtRequest } from 'src/auth/dto/jwt-request.dto';

@ApiTags('Recording')
@Controller('api/v1/recording')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class RecordingController {
  constructor(private readonly recordingService: RecordingService) {}

  @Post('record')
  @ApiOperation({ summary: 'Record a new API request' })
  @ApiResponse({ status: 201, description: 'Request recorded successfully' })
  async recordRequest(
    @Body() recordRequestDto: RecordRequestDto,
    // @Request() req: JwtRequest,
  ) {
    // Ensure the API ID belongs to the authenticated user
    return await this.recordingService.recordRequest(
      recordRequestDto,
      // req.user.id,
    );
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

  @Get('request/:id')
  @ApiOperation({ summary: 'Get a specific recorded request' })
  async getRequestById(
    @Param('id') id: string,
    //  @Request() req: JwtRequest
  ) {
    return await this.recordingService.getRequestById(id);
  }

  @Delete('request/:id')
  @ApiOperation({ summary: 'Delete a recorded request' })
  async deleteRequest(
    @Param('id') id: string,
    // @Request() req: JwtRequest
  ) {
    await this.recordingService.deleteRequest(id);
    return { message: 'Request deleted successfully' };
  }

  @Get(':apiId/stats')
  @ApiOperation({ summary: 'Get request statistics for an API' })
  async getRequestStats(
    @Param('apiId') apiId: string,
    // @Request() req: JwtRequest,
  ): Promise<any> {
    return await this.recordingService.getRequestStats(apiId);
  }
}
