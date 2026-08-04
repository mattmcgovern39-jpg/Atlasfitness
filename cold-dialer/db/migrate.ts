// Standalone CLI to (re)apply the schema without starting the Next.js app.
// Run with: npm run db:migrate
import { db } from './client';

console.log('Applying schema...');
db.pragma('quick_check');
console.log('Schema is up to date. Database file:', db.name);
