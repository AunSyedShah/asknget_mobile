import { useEffect, useState } from 'react';

import { useCartToken } from './cart-token';
import { useSession } from './session';

function allHydrated(): boolean {
  return useSession.persist.hasHydrated() && useCartToken.persist.hasHydrated();
}

/** True once the secure-store backed stores have loaded from the device. */
export function useStoresHydrated(): boolean {
  const [ready, setReady] = useState(allHydrated);

  useEffect(() => {
    const check = () => setReady(allHydrated());
    const unsubscribes = [useSession.persist.onFinishHydration(check), useCartToken.persist.onFinishHydration(check)];
    check();
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, []);

  return ready;
}
