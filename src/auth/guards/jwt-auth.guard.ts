import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { SKIP_GUARD_KEY } from 'src/common/decorators/skip-guard.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const skipGuard = this.reflector.getAllAndOverride<string>(SKIP_GUARD_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipGuard === 'jwt') {
      return true;
    }

    return super.canActivate(context);
  }
}
