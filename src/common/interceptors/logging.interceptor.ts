import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ErrorInterface } from 'src/common/types/Error.interface';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers['user-agent'] || '';
    const ip = request.ip || request.socket.remoteAddress || 'unknown';

    const now = Date.now();

    this.logger.log(`${method} ${url} - ${userAgent} - ${ip} - Started`);

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        this.logger.log(
          `${method} ${url} - ${response.statusCode} - ${delay}ms`,
        );
      }),
      catchError((error: ErrorInterface) => {
        const delay = Date.now() - now;
        this.logger.error(
          `${method} ${url} - ${error.status || 500} - ${delay}ms - ${error.message}`,
        );
        throw new Error(error.message || 'Internal server error');
      }),
    );
  }
}
