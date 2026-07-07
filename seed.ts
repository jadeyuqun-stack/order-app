import { createEmployee } from './src/lib/queries';

console.log('Seeding demo data...\n');

createEmployee('王小明', '技術部');
createEmployee('李美玲', '業務部');
createEmployee('張大偉', '技術部');
createEmployee('陳雅琪', '行政部');
createEmployee('林志豪', '業務部');

console.log('Done!');
process.exit(0);
