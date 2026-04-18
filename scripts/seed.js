const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function seed() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  // Create admin user if not exists
  try {
    const { user, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_verified: true,
    });
    if (error) {
      // If user exists, ignore
      if (error.message.includes('User already exists')) {
        console.log('Admin user already exists');
      } else {
        console.error('Admin creation error', error);
      }
    } else {
      console.log('Admin user created:', user?.id);
    }
  } catch (e) {
    console.log('Admin creation skipped or error', e);
  }

  // Seed sample products
  const products = [
    { id: 'p-demo-1', name: 'Ceremonial Origin A', category: 'Matcha Powder', price: 48, stock: 10, image: '', sku: 'RIT-MAT-001' },
    { id: 'p-demo-2', name: 'Hand-Carved Chasen', category: 'Teaware', price: 32, stock: 5, image: '', sku: 'RIT-ACC-042' },
    { id: 'p-demo-3', name: 'Roasted Hojicha Blend', category: 'Matcha Powder', price: 38, stock: 8, image: '', sku: 'RIT-MAT-009' },
  ];
  for (const pr of products) {
    try {
      await admin.from('products').upsert([pr]);
      console.log('Seeded product', pr.name);
    } catch (e) {
      console.error('Seed error for product', pr.name, e);
    }
  }
  console.log('Seeding complete.');
}

seed().catch((e) => {
  console.error('Seed script failed', e);
});
