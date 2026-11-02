import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { initialProjects, initialPlots, initialMapAssets, initialCategories, initialProducts } from '../src/data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../data/local-db.json');

console.log('🧹 [Reset] Initiating clean database reset for client delivery...');

const cleanDatabase = {
  categories: initialCategories,
  products: initialProducts,
  projects: initialProjects,
  plots: initialPlots,
  mapAssets: initialMapAssets,
  propertyInquiries: [],
  orders: [],
  orderItems: [],
  cart: [],
  inquiries: [],
  auditLogs: [],
  clientUsers: [],
  kycApplications: [],
  whatsappDispatches: [],
  mediaItems: [],
  adminUsers: [
    {
      id: 'admin-1',
      username: 'Shreejii',
      email: 'admin@shreeji.com',
      name: 'Shreeji Master Administrator',
      passwordHash: bcrypt.hashSync('Shreeji@108', 10),
      role: 'admin',
      createdAt: new Date().toISOString()
    },
    {
      id: 'admin-regal-farms',
      username: 'regalfarms',
      email: 'admin@regalfarms.com',
      name: 'Regal Farms Estate Administrator',
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ]
};

try {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(cleanDatabase, null, 2), 'utf8');
  console.log('✅ [Reset] Successfully cleared all demo inquiries, test KYC submissions, orders, and dispatches.');
  console.log('✅ [Reset] Seeded clean Master Admin (ID: Shreejii / Password: Shreeji@108).');
  console.log('🎉 [Reset] Database is pristine and ready for client delivery!');
} catch (err) {
  console.error('❌ [Reset] Failed to write clean database:', err.message);
  process.exit(1);
}
