/* eslint  @typescript-eslint/no-empty-function: 0 */

export type ISWATracker = {
  track: (
    eventType: string,
    customEvents?: string[],
    numericEvents?: number[]
  ) => void;
};

const SWA_NOOP: ISWATracker = {
  track(): void {},
};

let SWA_IMPL = SWA_NOOP;

export function initSWA(newSWA: ISWATracker): void {
  SWA_IMPL = newSWA;
}

export function getSWA(): ISWATracker {
  return SWA_IMPL;
}
