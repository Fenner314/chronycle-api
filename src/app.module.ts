import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './controllers/health.controller';
import { ChronicleConfigService } from './services/common/chronicle-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, ChronicleConfigService],
})
export class AppModule {}
