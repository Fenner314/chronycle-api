import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeysModule } from 'src/api-keys/api-keys.module';
import { CommonModule } from 'src/common/common.module';
import { Request } from 'src/recording/entities/request.entity';
import { ReplayController } from './replay.controller';
import { ReplayService } from './replay.service';

@Module({
  imports: [TypeOrmModule.forFeature([Request]), ApiKeysModule, CommonModule],
  controllers: [ReplayController],
  providers: [ReplayService],
  exports: [ReplayService],
})
export class ReplayModule {}
