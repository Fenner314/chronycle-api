import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './controllers/health.controller';
import { ChronicleConfigService } from './services/common/chronicle-config.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) || 5432 : 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'api_recorder',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, ChronicleConfigService],
})
export class AppModule {}
