import { desc, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../../db/index.ts';
import { admins, products, enquiries } from '../../db/schema.ts';
import { ADMIN_PASSWORD, ADMIN_USERNAME } from './config.js';

const seedProducts = [
  { name: 'Aurora Chandelier', category: 'Earrings', material: '18K Gold', stone: 'Natural Diamonds', price: 185000, image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=1000&q=85', description: 'A refined chandelier silhouette for evening occasions.', stock: 8, featured: 1 },
  { name: 'Meher Polki Jhumka', category: 'Jhumkas', material: '22K Gold', stone: 'Polki & Pearls', price: 240000, image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1000&q=85', description: 'Heritage-inspired polki craftsmanship with a contemporary finish.', stock: 5, featured: 1 },
  { name: 'Vanya Leaf Drops', category: 'Earrings', material: '18K Gold', stone: 'Cubic Zirconia', price: 78000, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85', description: 'A sculptural everyday drop with a delicate leaf profile.', stock: 12, featured: 0 }
];

// On a fresh database, create the default admin and the starter catalogue once.
let ready;
function ensureSeeded() {
  ready ??= (async () => {
    const existing = await db.select({ id: admins.id }).from(admins).limit(1);
    if (existing.length) return;
    const inserted = await db.insert(admins)
      .values({ username: ADMIN_USERNAME, passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 12) })
      .onConflictDoNothing().returning();
    if (inserted.length) await db.insert(products).values(seedProducts);
  })().catch(err => { ready = undefined; throw err; });
  return ready;
}

const toProduct = r => r && ({ id:r.id, name:r.name, category:r.category, material:r.material, stone:r.stone, price:r.price, image:r.image, description:r.description, stock:r.stock, featured:r.featured, created_at:r.createdAt, updated_at:r.updatedAt });
const toEnquiry = r => r && ({ id:r.id, name:r.name, phone:r.phone, email:r.email, message:r.message, status:r.status, created_at:r.createdAt });
const productFields = p => ({ name:p.name, category:p.category, material:p.material||'', stone:p.stone||'', price:Number(p.price)||0, image:p.image||'', description:p.description||'', stock:Number(p.stock)||0, featured:p.featured?1:0 });
const toId = id => { const n = Number(id); return Number.isInteger(n) && n > 0 ? n : null; };

export const store = {
  async findAdmin(username) {
    await ensureSeeded();
    const [a] = await db.select().from(admins).where(eq(admins.username, String(username||'')));
    return a ? { id:a.id, username:a.username, password_hash:a.passwordHash } : null;
  },
  async getProducts() {
    await ensureSeeded();
    return (await db.select().from(products).orderBy(desc(products.featured), desc(products.id))).map(toProduct);
  },
  async getProduct(id) {
    await ensureSeeded(); const n = toId(id); if (!n) return null;
    const [p] = await db.select().from(products).where(eq(products.id, n)); return toProduct(p) || null;
  },
  async createProduct(p) {
    await ensureSeeded();
    const [item] = await db.insert(products).values(productFields(p)).returning(); return toProduct(item);
  },
  async updateProduct(id, p) {
    const n = toId(id); if (!n) return null;
    const [item] = await db.update(products).set({ ...productFields(p), updatedAt:new Date() }).where(eq(products.id, n)).returning();
    return toProduct(item) || null;
  },
  async deleteProduct(id) {
    const n = toId(id); if (!n) return false;
    return (await db.delete(products).where(eq(products.id, n)).returning({ id:products.id })).length > 0;
  },
  async createEnquiry({name,phone,email,message}) {
    const [item] = await db.insert(enquiries).values({ name, phone, email:email||'', message:message||'' }).returning(); return toEnquiry(item);
  },
  async getEnquiries() { return (await db.select().from(enquiries).orderBy(desc(enquiries.createdAt), desc(enquiries.id))).map(toEnquiry); },
  async updateEnquiryStatus(id,status) {
    const n = toId(id); if (!n) return null;
    const [item] = await db.update(enquiries).set({ status }).where(eq(enquiries.id, n)).returning(); return toEnquiry(item) || null;
  }
};
