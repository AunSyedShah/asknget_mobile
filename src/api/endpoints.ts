/**
 * One function per API call the app uses. Types come from the generated
 * schema, so a field the server does not send is a compile error here.
 */
import { api } from './client';
import { unwrap } from './errors';
import type { components } from './schema';

export type Schemas = components['schemas'];
export type Paged<T> = { items: T[]; total: number; page: number; per_page: number; pages: number };

// ---- Market and catalogue -------------------------------------------------

export async function getRegion() {
  return unwrap(await api.GET('/api/v1/regions/current'));
}

export async function listCategories() {
  return unwrap(await api.GET('/api/v1/categories'));
}

export async function listBanners(placement: 'hero' | 'top_discount' | 'category_strip') {
  return unwrap(await api.GET('/api/v1/banners', { params: { query: { placement } } }));
}

export type ProductListQuery = {
  q?: string;
  category?: string;
  sort?: 'relevance' | 'new' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
  featured?: boolean;
  best_seller?: boolean;
  new_arrival?: boolean;
  page?: number;
  per_page?: number;
};

export async function listProducts(query: ProductListQuery): Promise<Paged<Schemas['ProductCardOut']>> {
  return unwrap(await api.GET('/api/v1/products', { params: { query } })) as Paged<Schemas['ProductCardOut']>;
}

export async function listProductFilters() {
  return unwrap(await api.GET('/api/v1/products/filters'));
}

export async function listProductRail(
  rail: 'featured' | 'best-sellers' | 'new-arrivals' | 'top-discounted',
  limit = 8,
): Promise<Schemas['ProductCardOut'][]> {
  switch (rail) {
    case 'featured':
      return unwrap(await api.GET('/api/v1/products/featured', { params: { query: { limit } } }));
    case 'best-sellers':
      return unwrap(await api.GET('/api/v1/products/best-sellers', { params: { query: { limit } } }));
    case 'new-arrivals':
      return unwrap(await api.GET('/api/v1/products/new-arrivals', { params: { query: { limit } } }));
    case 'top-discounted':
      return unwrap(await api.GET('/api/v1/products/top-discounted', { params: { query: { limit } } }));
  }
}

export async function getProduct(slug: string) {
  return unwrap(await api.GET('/api/v1/products/{slug}', { params: { path: { slug } } }));
}

export async function listReviews(slug: string, page = 1) {
  return unwrap(
    await api.GET('/api/v1/products/{slug}/reviews', { params: { path: { slug }, query: { page, per_page: 5 } } }),
  );
}

export async function searchSuggest(q: string) {
  return unwrap(await api.GET('/api/v1/search/suggest', { params: { query: { q, limit: 5 } } }));
}

export async function getReturnsPolicy() {
  return unwrap(await api.GET('/api/v1/returns/policy'));
}

// ---- Cart (guest or signed in) --------------------------------------------

export async function getCart() {
  return unwrap(await api.GET('/api/v1/cart'));
}

export async function addCartItem(variantId: string, qty: number) {
  return unwrap(await api.POST('/api/v1/cart/items', { body: { variant_id: variantId, qty } }));
}

export async function setCartItemQty(itemId: string, qty: number) {
  return unwrap(
    await api.PATCH('/api/v1/cart/items/{item_id}', { params: { path: { item_id: itemId } }, body: { qty } }),
  );
}

export async function removeCartItem(itemId: string) {
  return unwrap(await api.DELETE('/api/v1/cart/items/{item_id}', { params: { path: { item_id: itemId } } }));
}

export async function applyVoucher(code: string) {
  return unwrap(await api.POST('/api/v1/cart/voucher', { body: { code } }));
}

export async function removeVoucher() {
  return unwrap(await api.DELETE('/api/v1/cart/voucher'));
}

// ---- Account --------------------------------------------------------------

export async function login(email: string, password: string) {
  return unwrap(await api.POST('/api/v1/auth/login', { body: { email, password } }));
}

export async function register(body: {
  email: string;
  password: string;
  confirm_password: string;
  full_name?: string | null;
  phone?: string | null;
}) {
  return unwrap(await api.POST('/api/v1/auth/register', { body }));
}

export async function logout(refreshToken: string | null) {
  return unwrap(
    await api.POST('/api/v1/auth/logout', { body: { refresh_token: refreshToken, all_devices: false } }),
  );
}

export async function sendOtp(purpose: 'signup_email' | 'password_reset' | 'login', target: string) {
  return unwrap(await api.POST('/api/v1/auth/otp/send', { body: { channel: 'email', purpose, target } }));
}

export async function verifyOtp(purpose: 'signup_email' | 'password_reset' | 'login', target: string, code: string) {
  return unwrap(await api.POST('/api/v1/auth/otp/verify', { body: { channel: 'email', purpose, target, code } }));
}

export async function forgotPassword(email: string) {
  return unwrap(await api.POST('/api/v1/auth/password/forgot', { body: { email } }));
}

export async function resetPassword(body: { email: string; code: string; new_password: string; confirm_password: string }) {
  return unwrap(await api.POST('/api/v1/auth/password/reset', { body }));
}

export async function getMe() {
  return unwrap(await api.GET('/api/v1/me'));
}

export async function updateMe(body: Schemas['UserPatchIn']) {
  return unwrap(await api.PATCH('/api/v1/me', { body }));
}

export async function listAddresses() {
  return unwrap(await api.GET('/api/v1/me/addresses'));
}

export async function createAddress(body: Schemas['AddressIn']) {
  return unwrap(await api.POST('/api/v1/me/addresses', { body }));
}

export async function updateAddress(addressId: string, body: Schemas['AddressPatchIn']) {
  return unwrap(
    await api.PATCH('/api/v1/me/addresses/{address_id}', { params: { path: { address_id: addressId } }, body }),
  );
}

export async function deleteAddress(addressId: string) {
  return unwrap(await api.DELETE('/api/v1/me/addresses/{address_id}', { params: { path: { address_id: addressId } } }));
}

export async function setDefaultAddress(addressId: string) {
  return unwrap(
    await api.POST('/api/v1/me/addresses/{address_id}/default', { params: { path: { address_id: addressId } } }),
  );
}

export async function listWishlist() {
  return unwrap(await api.GET('/api/v1/me/wishlist'));
}

export async function addToWishlist(productId: string) {
  return unwrap(await api.PUT('/api/v1/me/wishlist/{product_id}', { params: { path: { product_id: productId } } }));
}

export async function removeFromWishlist(productId: string) {
  return unwrap(await api.DELETE('/api/v1/me/wishlist/{product_id}', { params: { path: { product_id: productId } } }));
}

export type OrderTab = 'all' | 'ongoing' | 'completed' | 'cancelled';

export async function listOrders(tab: OrderTab, page = 1) {
  return unwrap(await api.GET('/api/v1/me/orders', { params: { query: { tab, page, per_page: 12 } } }));
}

export async function getOrder(orderId: string) {
  return unwrap(await api.GET('/api/v1/me/orders/{order_id}', { params: { path: { order_id: orderId } } }));
}

export async function cancelOrder(orderId: string) {
  return unwrap(await api.POST('/api/v1/me/orders/{order_id}/cancel', { params: { path: { order_id: orderId } } }));
}

export async function reorder(orderId: string) {
  return unwrap(await api.POST('/api/v1/me/orders/{order_id}/reorder', { params: { path: { order_id: orderId } } }));
}

export async function trackOrder(orderNumber: string, email: string) {
  return unwrap(await api.POST('/api/v1/orders/track', { body: { order_number: orderNumber, email } }));
}

export async function listNotifications(tab: 'all' | 'orders' | 'returns', page = 1) {
  return unwrap(await api.GET('/api/v1/me/notifications', { params: { query: { tab, page, per_page: 20 } } }));
}

export async function notificationSummary() {
  return unwrap(await api.GET('/api/v1/me/notifications/summary'));
}

export async function markNotificationRead(notificationId: string) {
  return unwrap(
    await api.POST('/api/v1/me/notifications/{notification_id}/read', {
      params: { path: { notification_id: notificationId } },
    }),
  );
}

export async function markAllNotificationsRead() {
  return unwrap(await api.POST('/api/v1/me/notifications/read-all', { params: { query: { tab: 'all' } } }));
}

// ---- Buyer chat -----------------------------------------------------------

export async function chatSummary() {
  return unwrap(await api.GET('/api/v1/me/chat/summary'));
}

export async function listConversations(page = 1) {
  return unwrap(await api.GET('/api/v1/me/conversations', { params: { query: { page, per_page: 20 } } }));
}

export async function openConversation(body: Schemas['ConversationOpenIn']) {
  return unwrap(await api.POST('/api/v1/me/conversations', { body }));
}

export async function getConversation(conversationId: string, after?: string) {
  return unwrap(
    await api.GET('/api/v1/me/conversations/{conversation_id}', {
      params: { path: { conversation_id: conversationId }, query: { after, limit: 100 } },
    }),
  );
}

export async function sendMessage(conversationId: string, body: string) {
  return unwrap(
    await api.POST('/api/v1/me/conversations/{conversation_id}/messages', {
      params: { path: { conversation_id: conversationId } },
      body: { body },
    }),
  );
}

export async function markConversationRead(conversationId: string) {
  return unwrap(
    await api.POST('/api/v1/me/conversations/{conversation_id}/read', {
      params: { path: { conversation_id: conversationId } },
    }),
  );
}
