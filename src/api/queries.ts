import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCartToken } from '@/state/cart-token';
import { useSession } from '@/state/session';

import * as endpoints from './endpoints';

/** Query keys in one place, so mutations can invalidate precisely. */
export const keys = {
  region: ['region'] as const,
  categories: ['categories'] as const,
  banners: (placement: string) => ['banners', placement] as const,
  products: (query: endpoints.ProductListQuery) => ['products', query] as const,
  rail: (rail: string) => ['rail', rail] as const,
  product: (slug: string) => ['product', slug] as const,
  reviews: (slug: string) => ['reviews', slug] as const,
  me: ['me'] as const,
  addresses: ['addresses'] as const,
  wishlist: ['wishlist'] as const,
  orders: (tab: string) => ['orders', tab] as const,
  order: (id: string) => ['order', id] as const,
  notifications: (tab: string) => ['notifications', tab] as const,
  notificationSummary: ['notification-summary'] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  chatSummary: ['chat-summary'] as const,
};

export function useRegion() {
  return useQuery({ queryKey: keys.region, queryFn: endpoints.getRegion, staleTime: 5 * 60_000 });
}

export function useCategories() {
  return useQuery({ queryKey: keys.categories, queryFn: endpoints.listCategories, staleTime: 5 * 60_000 });
}

export function useBanners(placement: 'hero' | 'top_discount' | 'category_strip') {
  return useQuery({ queryKey: keys.banners(placement), queryFn: () => endpoints.listBanners(placement) });
}

export function useProducts(query: endpoints.ProductListQuery) {
  return useQuery({ queryKey: keys.products(query), queryFn: () => endpoints.listProducts(query) });
}

/** A product list that loads one page at a time ("Load more"). A new search or sort starts at page 1. */
export function useProductsInfinite(query: Omit<endpoints.ProductListQuery, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['products-infinite', query],
    queryFn: ({ pageParam }) => endpoints.listProducts({ ...query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });
}

export function useProductRail(rail: 'featured' | 'best-sellers' | 'new-arrivals' | 'top-discounted') {
  return useQuery({ queryKey: keys.rail(rail), queryFn: () => endpoints.listProductRail(rail, 6) });
}

export function useProduct(slug: string) {
  return useQuery({ queryKey: keys.product(slug), queryFn: () => endpoints.getProduct(slug), enabled: slug !== '' });
}

export function useReviews(slug: string) {
  return useQuery({ queryKey: keys.reviews(slug), queryFn: () => endpoints.listReviews(slug), enabled: slug !== '' });
}

export function useReturnsPolicy() {
  return useQuery({ queryKey: ['returns-policy'], queryFn: endpoints.getReturnsPolicy, staleTime: 10 * 60_000 });
}

/** The cart. Guests use the X-Cart-Token; the token is stored when the server issues one. */
export function useCart() {
  const token = useCartToken((state) => state.token);
  const signedIn = useSession((state) => state.accessToken !== null);
  return useQuery({
    queryKey: ['cart', token ?? 'guest', signedIn],
    queryFn: endpoints.getCart,
  });
}

/** Stores the guest cart token from any cart response that carries one. */
function captureCartToken(cart: { cart_token?: string | null }) {
  if (cart.cart_token) useCartToken.getState().setToken(cart.cart_token);
}

export function useCartMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['cart'] });

  const addItem = useMutation({
    mutationFn: ({ variantId, qty }: { variantId: string; qty: number }) => endpoints.addCartItem(variantId, qty),
    onSuccess: (cart) => {
      captureCartToken(cart);
      void refresh();
    },
  });
  const setQty = useMutation({
    mutationFn: ({ itemId, qty }: { itemId: string; qty: number }) => endpoints.setCartItemQty(itemId, qty),
    onSuccess: refresh,
  });
  const removeItem = useMutation({
    mutationFn: (itemId: string) => endpoints.removeCartItem(itemId),
    onSuccess: refresh,
  });
  const applyVoucher = useMutation({
    mutationFn: (code: string) => endpoints.applyVoucher(code),
    onSuccess: refresh,
  });
  const removeVoucher = useMutation({
    mutationFn: () => endpoints.removeVoucher(),
    onSuccess: refresh,
  });
  return { addItem, setQty, removeItem, applyVoucher, removeVoucher };
}

export function useMe() {
  const signedIn = useSession((state) => state.accessToken !== null);
  return useQuery({ queryKey: keys.me, queryFn: endpoints.getMe, enabled: signedIn });
}

export function useAddresses() {
  const signedIn = useSession((state) => state.accessToken !== null);
  return useQuery({ queryKey: keys.addresses, queryFn: endpoints.listAddresses, enabled: signedIn });
}

export function useWishlist() {
  const signedIn = useSession((state) => state.accessToken !== null);
  return useQuery({ queryKey: keys.wishlist, queryFn: endpoints.listWishlist, enabled: signedIn });
}

export function useOrders(tab: endpoints.OrderTab) {
  const signedIn = useSession((state) => state.accessToken !== null);
  return useQuery({ queryKey: keys.orders(tab), queryFn: () => endpoints.listOrders(tab), enabled: signedIn });
}

export function useOrder(orderId: string) {
  const signedIn = useSession((state) => state.accessToken !== null);
  return useQuery({
    queryKey: keys.order(orderId),
    queryFn: () => endpoints.getOrder(orderId),
    enabled: signedIn && orderId !== '',
  });
}

export function useNotifications(tab: 'all' | 'orders' | 'returns') {
  const signedIn = useSession((state) => state.accessToken !== null);
  return useQuery({
    queryKey: keys.notifications(tab),
    queryFn: () => endpoints.listNotifications(tab),
    enabled: signedIn,
  });
}

export function useNotificationSummary() {
  const signedIn = useSession((state) => state.accessToken !== null);
  return useQuery({
    queryKey: keys.notificationSummary,
    queryFn: endpoints.notificationSummary,
    enabled: signedIn,
    refetchInterval: 60_000,
  });
}

export function useConversations() {
  const signedIn = useSession((state) => state.accessToken !== null);
  return useQuery({ queryKey: keys.conversations, queryFn: () => endpoints.listConversations(), enabled: signedIn });
}

/** Polls every 5 seconds while the thread is open: the WebSocket is off on the server. */
export function useConversation(conversationId: string) {
  const signedIn = useSession((state) => state.accessToken !== null);
  return useQuery({
    queryKey: keys.conversation(conversationId),
    queryFn: () => endpoints.getConversation(conversationId),
    enabled: signedIn && conversationId !== '',
    refetchInterval: 5_000,
  });
}

export function useChatSummary() {
  const signedIn = useSession((state) => state.accessToken !== null);
  return useQuery({ queryKey: keys.chatSummary, queryFn: endpoints.chatSummary, enabled: signedIn, refetchInterval: 60_000 });
}
