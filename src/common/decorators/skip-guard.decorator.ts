import { SetMetadata } from '@nestjs/common';

export const SKIP_GUARD_KEY = 'skipGuard';
export const SkipGuard = (guardType: string) =>
  SetMetadata(SKIP_GUARD_KEY, guardType);
