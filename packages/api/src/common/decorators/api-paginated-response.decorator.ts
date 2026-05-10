import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export class PaginationMetaDto {
  total!: number;
  page!: number;
  perPage!: number;
}

/**
 * Decorator that documents an endpoint returning a paginated list inside the
 * standard `{ data, meta }` response envelope. Combine with the regular
 * `@ApiOperation` / `@ApiQuery` decorators on the route handler.
 */
export const ApiPaginatedResponse = <TModel extends Type<unknown>>(model: TModel) =>
  applyDecorators(
    ApiExtraModels(PaginationMetaDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                allOf: [
                  { $ref: getSchemaPath(PaginationMetaDto) },
                  {
                    type: 'object',
                    properties: {
                      requestId: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    }),
  );
