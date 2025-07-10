import { Module } from '@nestjs/common';
import { AxiosService } from './services/axios.service';
import { ChronicleConfigService } from './services/chronicle-config.service';

@Module({
  providers: [AxiosService, ChronicleConfigService],
  exports: [AxiosService, ChronicleConfigService],
})
export class CommonModule {}
