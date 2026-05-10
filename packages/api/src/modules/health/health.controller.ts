import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SERVER_VERSION } from '../../app.constants';

class HealthResponseDto {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';

  @ApiProperty({ description: 'Process uptime in seconds.' })
  uptime!: number;

  @ApiProperty({ description: 'ISO timestamp of when the data was loaded into memory.' })
  dataLoadedAt!: string;

  @ApiProperty({ description: 'Server package semver.' })
  version!: string;
}

@ApiTags('health')
@SkipThrottle({ short: true, medium: true, long: true })
@Controller({ path: 'health', version: '1' })
export class HealthController {
  private readonly startedAt = new Date();

  @Get()
  @ApiOperation({
    summary: 'Liveness probe.',
    description: 'Cheap, always-available endpoint for uptime monitors and load balancers.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  check(): HealthResponseDto {
    return {
      status: 'ok',
      uptime: process.uptime(),
      dataLoadedAt: this.startedAt.toISOString(),
      version: SERVER_VERSION,
    };
  }
}
