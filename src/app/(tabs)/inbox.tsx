import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { en } from '@/i18n/en';

export default function InboxScreen() {
  return (
    <Screen title={en.inbox.title}>
      <EmptyState title={en.inbox.emptyTitle} body={en.inbox.emptyBody} />
    </Screen>
  );
}
