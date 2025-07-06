import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ErrorInterface } from 'src/common/types/Error.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    console.log('=== HTTP EXCEPTION FILTER START ===');
    console.log('Exception type:', exception.constructor.name);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = exception.getStatus();
    const message = exception.getResponse();

    console.log('Status:', status);
    console.log('Message:', message);

    // Handle UnprocessableEntityException (validation errors) with special formatting
    if (exception instanceof UnprocessableEntityException) {
      console.log('Handling UnprocessableEntityException');
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse['message'] === 'Validation failed' &&
        Array.isArray(exceptionResponse['errors'])
      ) {
        const responseBody = {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: 'Validation failed',
          errors: exceptionResponse['errors'],
        };

        console.log('Sending validation error response:', responseBody);
        response.status(status).send(responseBody);
        console.log('=== HTTP EXCEPTION FILTER END ===');
        return;
      }
    }

    // Handle all other HTTP exceptions
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof message === 'string'
          ? message
          : (message as ErrorInterface).message || 'Error occurred',
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse)}`,
    );

    response.status(status).send(errorResponse);
    console.log('=== HTTP EXCEPTION FILTER END ===');
  }
}
