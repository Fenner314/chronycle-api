import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from 'src/api-keys/api-keys.service';
import { User } from 'src/users/entities/user.entity';
import { ApiKey } from 'src/api-keys/entities/api-key.entity';

// Extended Request interface
interface AuthenticatedRequest extends Request {
  user?: User;
  apiKey?: ApiKey;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('API key is required');
    }

    const clientIp = this.getClientIpAddress(request);
    const validApiKey = await this.apiKeysService.validateApiKey(
      apiKey,
      clientIp,
    );

    if (!validApiKey) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    // Attach user information to request
    request.apiKey = validApiKey;
    request.user = validApiKey.user;

    return true;
  }

  private getClientIpAddress(request: AuthenticatedRequest): string {
    // Get forwarded IP with proper type checking
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const forwardedIp = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor;
      if (typeof forwardedIp === 'string') {
        return forwardedIp.split(',')[0]?.trim() || 'unknown';
      }
    }

    // Get real IP
    const realIp = request.headers['x-real-ip'];
    if (typeof realIp === 'string') {
      return realIp;
    }

    // Try request.ip (Express)
    if (typeof request.ip === 'string') {
      return request.ip;
    }

    // Try connection.remoteAddress
    const connectionIp = request.socket?.remoteAddress;
    if (typeof connectionIp === 'string') {
      return connectionIp;
    }

    // Try socket.remoteAddress
    const socketIp = request.socket?.remoteAddress;
    if (typeof socketIp === 'string') {
      return socketIp;
    }

    return 'unknown';
  }
}
