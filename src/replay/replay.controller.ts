import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ReplayRequestDto } from './dto/replay-request.dto';
import { ReplayService } from './replay.service';
import { ApiKey } from 'src/common/decorators/api-key.decorator';

@ApiTags('Replay')
@Controller('api/v1/replay')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class ReplayController {
  constructor(private readonly replayService: ReplayService) {}

  @Post()
  @ApiOperation({ summary: 'Replay an API request' })
  @ApiResponse({ status: 201, description: 'Request recorded successfully' })
  async replayRequest(
    @Body() replayRequestDto: ReplayRequestDto,
    @ApiKey() apiKey: string,
  ): Promise<any> {
    return await this.replayService.replayRequest(replayRequestDto.id, apiKey);
  }
}
