import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Inject(CACHE_MANAGER) private readonly cacheManager: any,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.cacheManager.set('health_check', 'ok', 5000);
      const value = await this.cacheManager.get('health_check');
      if (value === 'ok') {
        return indicator.up();
      }
      return indicator.down({ message: 'Redis ping failed' });
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }
}