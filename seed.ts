import { db } from './src/lib/db';
import { createStore, createMenuItem, createDailyOrder, createEmployee } from './src/lib/queries';

console.log('Seeding demo data...\n');

// Clear existing data
db.exec('DELETE FROM orders');
db.exec('DELETE FROM daily_orders');
db.exec('DELETE FROM menu_items');
db.exec('DELETE FROM stores');
db.exec('DELETE FROM employees');

// Create stores
createStore('美食堂');
createStore('麵食館');
createStore('輕食屋');

const stores: any[] = db.prepare('SELECT * FROM stores').all();
console.log(`Created ${stores.length} stores`);

// Create menu items
for (const store of stores) {
  if (store.name === '美食堂') {
    createMenuItem(store.id, '排骨飯', 85, '主餐');
    createMenuItem(store.id, '控肉飯', 80, '主餐');
    createMenuItem(store.id, '滷肉飯', 70, '主餐');
    createMenuItem(store.id, '雞腿飯', 90, '主餐');
    createMenuItem(store.id, '冬瓜茶', 20, '飲料');
  } else if (store.name === '麵食館') {
    createMenuItem(store.id, '牛肉麵', 120, '主餐');
    createMenuItem(store.id, '大腸麵線', 65, '小吃');
    createMenuItem(store.id, '酸辣麵', 70, '主餐');
    createMenuItem(store.id, '貢丸湯', 55, '湯品');
  } else if (store.name === '輕食屋') {
    createMenuItem(store.id, '凱薩沙拉', 80, '沙拉');
    createMenuItem(store.id, '雞胸三明治', 75, '三明治');
    createMenuItem(store.id, '水果杯', 50, '甜點');
    createMenuItem(store.id, '綜合蔬果汁', 45, '飲料');
  }
}

const items = db.prepare('SELECT COUNT(*) as count FROM menu_items').get() as { count: number };
console.log(`Created ${items.count} menu items`);

// Create some employees
createEmployee('王小明', '技術部');
createEmployee('李美玲', '業務部');
createEmployee('張大偉', '技術部');
createEmployee('陳雅琪', '行政部');
createEmployee('林志豪', '業務部');

const emps = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
console.log(`Created ${emps.count} employees`);

// Create a daily order for tomorrow
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(13, 0, 0, 0);
const deadlineStr = tomorrow.toISOString().slice(0, 16).replace('T', ' ');

createDailyOrder(tomorrow.toISOString().split('T')[0], stores[0].id, deadlineStr);
console.log(`Created daily order for tomorrow (${stores[0].name})`);

console.log('\nDone! Seed data ready.');
process.exit(0);
