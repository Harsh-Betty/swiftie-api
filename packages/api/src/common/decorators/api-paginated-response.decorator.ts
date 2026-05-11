import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items available, before pagination.' })
  total!: number;

  @ApiProperty({ description: 'Limit echoed back from the request (clamped to bounds).' })
  limit!: number;

  @ApiProperty({ description: 'Offset echoed back from the request.' })
  offset!: number;
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
