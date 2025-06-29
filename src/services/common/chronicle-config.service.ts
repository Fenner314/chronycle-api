import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '../../types/common/EnvKeys.enum';

@Injectable()
export class ChronicleConfigService {
  constructor(private readonly configService: ConfigService) {}

  get<T = string>(key: EnvKeys, defaultValue?: T): T {
    return this.configService.get<T>(key) ?? defaultValue ?? (undefined as T);
  }
}
