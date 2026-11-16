import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';

import { en } from '@/i18n/en';

import { FeatureGate, FeatureTableProvider, runIfLive } from './feature-gate';
import { FEATURES, type FeatureTable } from './registry';

const liveWallet: FeatureTable = { ...FEATURES, wallet: 'live' };
const hiddenWallet: FeatureTable = { ...FEATURES, wallet: 'hidden' };

function renderWithTable(table: FeatureTable, ui: ReactElement) {
  return render(<FeatureTableProvider table={table}>{ui}</FeatureTableProvider>);
}

describe('FeatureGate', () => {
  it('renders the real content when the feature is live', async () => {
    const { queryByText } = await renderWithTable(
      liveWallet,
      <FeatureGate feature="wallet">
        <Text>Real wallet</Text>
      </FeatureGate>,
    );
    expect(queryByText('Real wallet')).not.toBeNull();
    expect(queryByText(en.common.comingSoon)).toBeNull();
  });

  it('blocks the real content and shows the coming-soon badge while comingSoon', async () => {
    const { queryByText } = await renderWithTable(
      FEATURES,
      <FeatureGate feature="wallet">
        <Text>Real wallet</Text>
      </FeatureGate>,
    );
    expect(queryByText('Real wallet')).toBeNull();
    expect(queryByText(en.common.comingSoon)).not.toBeNull();
  });

  it('shows a custom comingSoon treatment when one is given', async () => {
    const { queryByText } = await renderWithTable(
      FEATURES,
      <FeatureGate feature="wallet" comingSoon={<Text>Wallet is on its way</Text>}>
        <Text>Real wallet</Text>
      </FeatureGate>,
    );
    expect(queryByText('Wallet is on its way')).not.toBeNull();
    expect(queryByText('Real wallet')).toBeNull();
  });

  it('renders nothing when hidden', async () => {
    const { queryByText } = await renderWithTable(
      hiddenWallet,
      <FeatureGate feature="wallet">
        <Text>Real wallet</Text>
      </FeatureGate>,
    );
    expect(queryByText('Real wallet')).toBeNull();
    expect(queryByText(en.common.comingSoon)).toBeNull();
  });
});

describe('runIfLive', () => {
  it('runs the action only while live', () => {
    const action = jest.fn(() => 'done');
    expect(runIfLive('live', action)).toBe('done');
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('never runs the action while comingSoon, and reports the block', () => {
    const action = jest.fn(() => 'done');
    const onBlocked = jest.fn();
    expect(runIfLive('comingSoon', action, onBlocked)).toBeUndefined();
    expect(action).not.toHaveBeenCalled();
    expect(onBlocked).toHaveBeenCalledTimes(1);
  });
});

describe('registry', () => {
  it('keeps cash on delivery and online payments coming soon until the backend has them', () => {
    expect(FEATURES.cashOnDelivery).toBe('comingSoon');
    expect(FEATURES.onlinePayments).toBe('comingSoon');
  });

  it('has buyer chat live, because the backend serves it', () => {
    expect(FEATURES.buyerChat).toBe('live');
  });

  it('keeps every feature the backend cannot serve coming soon', () => {
    const notServed = [
      'wallet',
      'liveTracking',
      'socialAuth',
      'imageSearch',
      'voiceSearch',
      'inboxPromos',
      'inboxCoupons',
      'inboxPriceDrops',
      'savedCards',
      'productFaq',
    ] as const;
    for (const key of notServed) expect(FEATURES[key]).toBe('comingSoon');
  });
});
