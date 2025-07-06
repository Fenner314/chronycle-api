import { ApiKey } from 'src/api-keys/entities/api-key.entity';

export interface JwtRequest extends Request {
  user: {
    id: string;
  };
  apiKey: ApiKey;
}
