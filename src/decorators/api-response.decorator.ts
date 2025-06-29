import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiResponseWrapper = <T extends Type<any>>(
  model: T,
  status = 200,
  description?: string,
) => {
  return applyDecorators(
    ApiResponse({
      status,
      description: description || 'Success',
      schema: {
        allOf: [
          {
            properties: {
              data: {
                $ref: getSchemaPath(model),
              },
              statusCode: {
                type: 'number',
                example: status,
              },
              message: {
                type: 'string',
                example: 'Success',
              },
              timestamp: {
                type: 'string',
                example: new Date().toISOString(),
              },
            },
          },
        ],
      },
    }),
  );
};
