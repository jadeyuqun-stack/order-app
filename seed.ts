import { db } from './src/lib/db';
import { createDailyOrder, createEmployee } from './src/lib/queries';

console.log('Seeding demo data...\n');

db.exec('DELETE FROM orders');
db.exec('DELETE FROM daily_orders');
db.exec('DELETE FROM restaurants');
db.exec('DELETE FROM employees');

const uuid = require('uuid').v4;

db.prepare('INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)').run(uuid(), '美食堂', '');
db.prepare('INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)').run(uuid(), '麵食館', '');
db.prepare('INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)').run(uuid(), '輕食屋', '');

createEmployee('王小明', '技術部');
createEmployee('李美玲', '業務部');
createEmployee('張大偉', '技術部');
createEmployee('陳雅琪', '行政部');
createEmployee('林志豪', '業務部');

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(13, 0, 0, 0);
const deadlineStr = tomorrow.toISOString().slice(0, 16).replace('T', ' ');
const stores = db.prepare('SELECT * FROM restaurants').all();
createDailyOrder(tomorrow.toISOString().split('T')[0], (stores[0] as any).id, deadlineStr);

console.log('Done!');
process.exit(0);
