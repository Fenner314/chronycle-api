import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { ChronicleConfigService } from './common/services/chronicle-config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordingModule } from './recording/recording.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ExceptionFiltersModule } from './common/filters/exception-filters.module';
import { ReplayModule } from './replay/replay.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT as string),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
      ssl:
        process.env.NODE_ENV === 'production'
          ? {
              rejectUnauthorized: false,
            }
          : false,
      logging: process.env.NODE_ENV === 'development',
    }),
    ExceptionFiltersModule,
    CommonModule,
    AuthModule,
    UsersModule,
    ApiKeysModule,
    RecordingModule,
    ReplayModule,
    // ApiRegistrationModule,
    // ReplayModule
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, ChronicleConfigService],
})
export class AppModule {}
