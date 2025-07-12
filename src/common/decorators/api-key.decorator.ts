import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const ApiKey = createParamDecorator(
  (data: 'key' | 'entity' | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { apiKey?: any }>();

    if (data === 'key') {
      return request.headers['x-api-key'];
    }

    return request.apiKey;
  },
);
