/**
 * English copy. Every user-visible string goes through this file so other
 * languages can be added per market (af, zu, ...) without touching screens.
 */
export const en = {
  common: {
    back: 'Back',
    comingSoon: 'Coming soon',
    comingSoonBody: 'This is not available yet. We will tell you when it is.',
  },
  tabs: {
    home: 'Home',
    category: 'Category',
    inbox: 'Inbox',
    cart: 'Cart',
    account: 'Account',
  },
  home: {
    title: 'Welcome to AsknGet',
    emptyTitle: 'Nothing to show yet',
    emptyBody: 'Products and offers appear here once the catalogue is connected.',
  },
  category: {
    title: 'Categories',
    emptyTitle: 'No categories yet',
    emptyBody: 'Categories appear here once they are loaded from the server.',
  },
  inbox: {
    title: 'Inbox',
    emptyTitle: 'No notifications',
    emptyBody: 'Order and return updates will show up here.',
  },
  cart: {
    title: 'My Cart',
    emptyTitle: 'Your cart is empty',
    emptyBody: 'Add something you like and it will wait for you here.',
  },
  account: {
    title: 'Account',
    emptyTitle: 'Sign in to see your account',
    emptyBody: 'Your orders, addresses and wishlist appear after you sign in.',
  },
} as const;
