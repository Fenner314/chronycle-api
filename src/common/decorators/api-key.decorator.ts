import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const ApiKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.headers['x-api-key'] as string;
  },
);
