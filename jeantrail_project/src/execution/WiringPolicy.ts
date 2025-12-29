import { VerificationResult } from '../verify/VerificationTypes';
import { AutonomyMode } from '../autonomy/AutonomyTypes';

export function allowWiring(verification: VerificationResult, autonomy: AutonomyMode): boolean {
  if (verification !== 'pass') return false;
  if (autonomy !== 'bounded') return false;
  return true;
}

