import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordingController } from './recording.controller';
import { RecordingService } from './recording.service';
import { RecordedRequest } from './entities/recorded-request.entity';
import { ApiKeysModule } from 'src/api-keys/api-keys.module';

@Module({
  imports: [TypeOrmModule.forFeature([RecordedRequest]), ApiKeysModule],
  controllers: [RecordingController],
  providers: [RecordingService],
  exports: [RecordingService],
})
export class RecordingModule {}
