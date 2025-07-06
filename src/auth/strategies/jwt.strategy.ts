import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ChronicleConfigService as ConfigService } from 'src/common/services/chronicle-config.service';
import { EnvKeys } from 'src/common/types/EnvKeys.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(EnvKeys.JWT_SECRET),
    });
  }

  validate(payload: { sub: string; email: string }): {
    id: string;
    email: string;
  } {
    console.log('payload', payload);
    return { id: payload.sub, email: payload.email };
  }
}
