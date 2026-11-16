import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { en } from '@/i18n/en';

export default function CategoryScreen() {
  return (
    <Screen title={en.category.title}>
      <EmptyState title={en.category.emptyTitle} body={en.category.emptyBody} />
    </Screen>
  );
}
