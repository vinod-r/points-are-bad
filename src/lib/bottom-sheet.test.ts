import { describe, expect, it } from 'vitest';
import { shouldDismissBottomSheet } from './bottom-sheet';

describe('shouldDismissBottomSheet', () => {
  it('dismisses after a deliberate downward drag', () => {
    expect(shouldDismissBottomSheet(96, 500)).toBe(true);
  });

  it('dismisses a shorter, fast downward flick', () => {
    expect(shouldDismissBottomSheet(40, 50)).toBe(true);
  });

  it('snaps back after a short or slow drag', () => {
    expect(shouldDismissBottomSheet(35, 30)).toBe(false);
    expect(shouldDismissBottomSheet(60, 500)).toBe(false);
  });

  it('does not dismiss when dragged upward', () => {
    expect(shouldDismissBottomSheet(-100, 100)).toBe(false);
  });
});
