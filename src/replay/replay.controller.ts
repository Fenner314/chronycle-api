import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReplayRequestDto } from './dto/replay-request.dto';
import { ReplayService } from './replay.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtRequest } from 'src/auth/dto/jwt-request.dto';

@ApiTags('Replay')
@Controller('api/v1/replay')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReplayController {
  constructor(private readonly replayService: ReplayService) {}

  @Post()
  @ApiOperation({ summary: 'Replay an API request' })
  @ApiResponse({ status: 201, description: 'Request recorded successfully' })
  async replayRequest(
    @Request() req: JwtRequest,
    @Body() replayRequestDto: ReplayRequestDto,
  ): Promise<any> {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    return await this.replayService.replayRequest(
      replayRequestDto.id,
      req.user.id,
    );
  }
}
