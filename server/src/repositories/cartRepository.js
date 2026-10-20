import { localStore, persistLocalStoreAsync } from '../config/database.js';

export const cartRepository = {
  getCart: async (cartId) => {
    return localStore.cart.filter((item) => item.cartId === cartId);
  },

  addItem: async (cartId, product, quantity = 1) => {
    const existing = localStore.cart.find((c) => c.cartId === cartId && c.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
      await persistLocalStoreAsync();
      return existing;
    }

    const newItem = {
      id: `cart-item-${Date.now()}`,
      cartId,
      productId: product.id,
      product,
      quantity,
      addedAt: new Date().toISOString(),
    };
    localStore.cart.push(newItem);
    await persistLocalStoreAsync();
    return newItem;
  },

  removeItem: async (cartId, itemId) => {
    const idx = localStore.cart.findIndex(
      (c) => c.cartId === cartId && (c.id === itemId || c.productId === itemId)
    );
    if (idx === -1) return false;
    localStore.cart.splice(idx, 1);
    await persistLocalStoreAsync();
    return true;
  },

  clearCart: async (cartId) => {
    localStore.cart = localStore.cart.filter((c) => c.cartId !== cartId);
    await persistLocalStoreAsync();
    return true;
  },
};
