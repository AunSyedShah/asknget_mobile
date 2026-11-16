import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { en } from '@/i18n/en';

export default function HomeScreen() {
  return (
    <Screen title={en.home.title}>
      <EmptyState title={en.home.emptyTitle} body={en.home.emptyBody} />
    </Screen>
  );
}
