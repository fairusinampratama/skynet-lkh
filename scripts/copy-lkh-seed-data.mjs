import fs from 'fs';
import path from 'path';

const sourceFiles = [
  'LKH SKYNET PERIODE 2026 - Copy of JANUARI.csv',
  'LKH SKYNET PERIODE 2026 - FEBRUARI (1).csv',
  'LKH SKYNET PERIODE 2026 - MARET (1).csv',
  'LKH SKYNET PERIODE 2026 - APRIL (1).csv',
  'LKH SKYNET PERIODE 2026 - MEI (1).csv',
  'LKH SKYNET PERIODE 2026 - JUNI (3).csv'
];

const outputDir = path.resolve(process.cwd(), 'dist', 'lkh-seed-data');
fs.mkdirSync(outputDir, { recursive: true });

for (const fileName of sourceFiles) {
  const sourcePath = path.resolve(process.cwd(), fileName);
  const targetPath = path.join(outputDir, fileName);
  fs.copyFileSync(sourcePath, targetPath);
}

console.log(`Copied ${sourceFiles.length} LKH seed CSV files to ${path.relative(process.cwd(), outputDir)}.`);
