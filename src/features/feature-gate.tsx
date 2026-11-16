import { createContext, useCallback, useContext, type ReactNode } from 'react';

import { ComingSoonBadge } from '@/components/coming-soon';

import { FEATURES, type FeatureKey, type FeatureState, type FeatureTable } from './registry';

const FeatureTableContext = createContext<FeatureTable>(FEATURES);

/**
 * Lets a test (or a later server override) supply another table.
 * Production code uses the default: the registry file.
 */
export function FeatureTableProvider({ table, children }: { table: FeatureTable; children: ReactNode }) {
  return <FeatureTableContext.Provider value={table}>{children}</FeatureTableContext.Provider>;
}

export function useFeature(key: FeatureKey): FeatureState {
  return useContext(FeatureTableContext)[key];
}

/** Runs the action only while the feature is live. Otherwise it does nothing. */
export function runIfLive<T>(state: FeatureState, action: () => T, onBlocked?: () => void): T | undefined {
  if (state === 'live') return action();
  onBlocked?.();
  return undefined;
}

/** Wraps an action so a button can never trigger a feature that is not live. */
export function useFeatureAction<Args extends unknown[], R>(
  key: FeatureKey,
  action: (...args: Args) => R,
  onBlocked?: () => void,
): (...args: Args) => R | undefined {
  const state = useFeature(key);
  return useCallback((...args: Args) => runIfLive(state, () => action(...args), onBlocked), [state, action, onBlocked]);
}

type FeatureGateProps = {
  feature: FeatureKey;
  children: ReactNode;
  /** Shown while comingSoon. Defaults to a small "Coming soon" badge. */
  comingSoon?: ReactNode;
};

/** live: children. comingSoon: the comingSoon treatment. hidden: nothing. */
export function FeatureGate({ feature, children, comingSoon }: FeatureGateProps) {
  const state = useFeature(feature);
  if (state === 'live') return <>{children}</>;
  if (state === 'hidden') return null;
  return <>{comingSoon ?? <ComingSoonBadge />}</>;
}
