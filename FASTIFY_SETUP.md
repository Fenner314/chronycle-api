# Fastify Setup Guide

This project has been configured with Fastify and includes comprehensive middleware, interceptors, guards, and filters.

## 🚀 Features Included

### Core Fastify Plugins

- **@fastify/cors** - Cross-Origin Resource Sharing
- **@fastify/helmet** - Security headers
- **@fastify/compress** - Response compression
- **@fastify/rate-limit** - Rate limiting
- **@fastify/multipart** - File upload support

### Interceptors

- **LoggingInterceptor** - Request/response logging with timing
- **TransformInterceptor** - Standardized API response format

### Filters

- **HttpExceptionFilter** - Global error handling

### Guards

- **ApiKeyGuard** - API key authentication

### Middleware

- **RequestIdMiddleware** - Request ID tracking (ready to use)

### Decorators

- **ApiResponseWrapper** - Swagger documentation helper

## 📁 File Structure

```
src/
├── interceptors/
│   ├── logging.interceptor.ts
│   └── transform.interceptor.ts
├── filters/
│   └── http-exception.filter.ts
├── guards/
│   └── api-key.guard.ts
├── middleware/
│   └── request-id.middleware.ts
├── decorators/
│   └── api-response.decorator.ts
├── app.module.ts
└── main.ts
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Security
API_KEY=your-secret-api-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# File Upload
MAX_FILE_SIZE=10485760
```

## 🔧 Usage Examples

### Using the Transform Interceptor

All responses are automatically wrapped in this format:

```json
{
  "data": {
    /* your actual data */
  },
  "statusCode": 200,
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Using the API Response Decorator

```typescript
import { ApiResponseWrapper } from './decorators/api-response.decorator';
import { UserDto } from './dto/user.dto';

@Get()
@ApiResponseWrapper(UserDto, 200, 'Users retrieved successfully')
async getUsers(): Promise<UserDto[]> {
  return this.userService.findAll();
}
```

### Using the Request ID Middleware

To enable request ID tracking, add to your module:

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
```

## 🛡️ Security Features

- **Helmet** - Security headers
- **Rate Limiting** - 100 requests per minute by default
- **API Key Authentication** - Configurable via API_KEY env var
- **CORS** - Configurable origins
- **Request Validation** - Global validation pipe

## 📊 Logging

Uses Pino logger with pretty formatting:

- Request/response logging with timing
- Error logging with stack traces
- Configurable log levels

## 🚀 Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` file from the example above

3. Start the development server:

   ```bash
   npm run start:dev
   ```

4. Access Swagger documentation at `http://localhost:3000/docs`

## 🔍 Monitoring

- Request timing is automatically logged
- Request IDs for tracing
- Structured logging with Pino
- Error tracking with stack traces

## 📝 Notes

- The API key guard is optional - if no API_KEY is set, all requests are allowed
- Rate limiting is set to 100 requests per minute per IP
- File uploads are limited to 10MB by default
- All responses are automatically compressed if > 1KB
