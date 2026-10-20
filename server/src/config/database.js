import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import { config } from './env.js';
import { initialCategories, initialProducts } from '../data/seedData.js';

let pgPool = null;
let isPostgres = false;

// In-memory data store for local dev or fallback
const localStore = {
  categories: [...initialCategories],
  products: [...initialProducts],
  orders: [],
  cart: [],
  inquiries: [],
};

const localDbPath = path.join(config.dataDir, 'local-db.json');

// Helper to save local store to disk
const persistLocalStore = () => {
  try {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }
    fs.writeFileSync(localDbPath, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Failed to persist local store:', err.message);
  }
};

// Helper to load local store from disk
const loadLocalStore = () => {
  try {
    if (fs.existsSync(localDbPath)) {
      const data = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
      if (data.products && Array.isArray(data.products)) localStore.products = data.products;
      if (data.categories && Array.isArray(data.categories)) localStore.categories = data.categories;
      if (data.orders && Array.isArray(data.orders)) localStore.orders = data.orders;
      if (data.cart && Array.isArray(data.cart)) localStore.cart = data.cart;
      if (data.inquiries && Array.isArray(data.inquiries)) localStore.inquiries = data.inquiries;
    } else {
      persistLocalStore();
    }
  } catch (err) {
    console.warn('[DB] Could not load local-db.json, using seed data:', err.message);
  }
};

/**
 * Initialize Database Connection
 */
export const initDatabase = async () => {
  if (config.databaseUrl) {
    try {
      pgPool = new Pool({
        connectionString: config.databaseUrl,
        ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 20, // Max clients in pool for high throughput
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      const client = await pgPool.connect();
      console.log('✅ [DB] Connected to PostgreSQL / Supabase successfully');
      
      // Auto-create essential schema tables if needed
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          featured BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          category VARCHAR(255),
          category_id VARCHAR(64),
          price NUMERIC NOT NULL,
          discount_price NUMERIC,
          in_stock BOOLEAN DEFAULT true,
          stock_count INT DEFAULT 0,
          rating NUMERIC DEFAULT 5.0,
          review_count INT DEFAULT 0,
          featured BOOLEAN DEFAULT false,
          is_new BOOLEAN DEFAULT false,
          sku VARCHAR(100),
          images JSONB DEFAULT '[]',
          description TEXT,
          tags JSONB DEFAULT '[]',
          specs JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(64) PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(50),
          shipping_address JSONB NOT NULL,
          items JSONB NOT NULL,
          subtotal NUMERIC NOT NULL,
          tax NUMERIC DEFAULT 0,
          total NUMERIC NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          payment_method VARCHAR(50) DEFAULT 'cod',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS inquiries (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          subject VARCHAR(255),
          message TEXT NOT NULL,
          product_id VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      client.release();
      isPostgres = true;
      return { type: 'postgresql', status: 'connected' };
    } catch (err) {
      console.error('⚠️ [DB] PostgreSQL connection failed, falling back to local memory store:', err.message);
      loadLocalStore();
      return { type: 'local-memory', status: 'fallback', error: err.message };
    }
  } else {
    console.log('ℹ️ [DB] No DATABASE_URL provided. Running with ultra-fast local memory/JSON store.');
    loadLocalStore();
    return { type: 'local-memory', status: 'active' };
  }
};

/**
 * DB Service layer providing unified CRUD operations
 */
export const db = {
  isPostgres: () => isPostgres,

  // Products
  getProducts: async ({ category, search, minPrice, maxPrice, inStock, sort, limit = 50, page = 1 } = {}) => {
    let items = [...localStore.products];

    if (category) {
      items = items.filter(
        (p) => p.category === category || p.categoryId === category
      );
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (minPrice !== undefined && minPrice !== '') {
      items = items.filter((p) => p.price >= parseFloat(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      items = items.filter((p) => p.price <= parseFloat(maxPrice));
    }
    if (inStock !== undefined) {
      const stockBool = inStock === 'true' || inStock === true;
      items = items.filter((p) => p.inStock === stockBool);
    }

    // Sorting
    if (sort === 'price-low') {
      items.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sort === 'price-high') {
      items.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sort === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'newest') {
      items.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      products: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  getProductById: async (id) => {
    return localStore.products.find((p) => p.id === id || p.slug === id) || null;
  },

  createProduct: async (productData) => {
    localStore.products.unshift(productData);
    persistLocalStore();
    return productData;
  },

  updateProduct: async (id, updates) => {
    const index = localStore.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    localStore.products[index] = { ...localStore.products[index], ...updates };
    persistLocalStore();
    return localStore.products[index];
  },

  deleteProduct: async (id) => {
    const index = localStore.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    localStore.products.splice(index, 1);
    persistLocalStore();
    return true;
  },

  // Categories
  getCategories: async () => {
    return localStore.categories;
  },

  getCategoryBySlug: async (slug) => {
    return localStore.categories.find((c) => c.slug === slug || c.id === slug) || null;
  },

  createCategory: async (categoryData) => {
    localStore.categories.push(categoryData);
    persistLocalStore();
    return categoryData;
  },

  // Orders
  getOrders: async () => {
    return localStore.orders;
  },

  getOrderById: async (id) => {
    return localStore.orders.find((o) => o.id === id) || null;
  },

  createOrder: async (orderData) => {
    localStore.orders.unshift(orderData);
    persistLocalStore();
    return orderData;
  },

  updateOrderStatus: async (id, status) => {
    const order = localStore.orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    persistLocalStore();
    return order;
  },

  // Inquiries
  createInquiry: async (inquiryData) => {
    localStore.inquiries.unshift(inquiryData);
    persistLocalStore();
    return inquiryData;
  },

  getInquiries: async () => {
    return localStore.inquiries;
  },

  // Cart (session / temporary store)
  getCart: async (cartId) => {
    return localStore.cart.filter((item) => item.cartId === cartId);
  },

  addToCart: async (cartId, product, quantity = 1) => {
    const existing = localStore.cart.find((c) => c.cartId === cartId && c.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
      persistLocalStore();
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
    persistLocalStore();
    return newItem;
  },

  removeFromCart: async (cartId, itemId) => {
    const idx = localStore.cart.findIndex((c) => c.cartId === cartId && (c.id === itemId || c.productId === itemId));
    if (idx === -1) return false;
    localStore.cart.splice(idx, 1);
    persistLocalStore();
    return true;
  },

  clearCart: async (cartId) => {
    localStore.cart = localStore.cart.filter((c) => c.cartId !== cartId);
    persistLocalStore();
    return true;
  },
};
