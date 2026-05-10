import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_KEY = 'swiftie:raw-response';

/**
 * Marks a route handler whose return value must NOT be wrapped by
 * `TransformInterceptor` (e.g. binary image proxy responses, streamed
 * payloads, or HTML).
 */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
