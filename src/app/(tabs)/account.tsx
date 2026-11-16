import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { en } from '@/i18n/en';

export default function AccountScreen() {
  return (
    <Screen title={en.account.title}>
      <EmptyState title={en.account.emptyTitle} body={en.account.emptyBody} />
    </Screen>
  );
}
