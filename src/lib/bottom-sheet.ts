const DISMISS_DISTANCE_PX = 96;
const MIN_FLING_DISTANCE_PX = 36;
const DISMISS_VELOCITY_PX_PER_MS = 0.65;

export function shouldDismissBottomSheet(distancePx: number, elapsedMs: number): boolean {
  if (distancePx >= DISMISS_DISTANCE_PX) return true;
  const velocity = distancePx / Math.max(elapsedMs, 1);
  return distancePx >= MIN_FLING_DISTANCE_PX && velocity >= DISMISS_VELOCITY_PX_PER_MS;
}
