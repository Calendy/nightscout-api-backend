#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🗄️  Resetting SQLite database...');

// Remove existing SQLite database file
const dbPath = path.join(__dirname, 'database.sqlite');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Removed existing database.sqlite');
} else {
  console.log('ℹ️  No existing database.sqlite found');
}

console.log('🎉 Database reset complete!');
console.log('💡 Run "npm run dev" to create a fresh database');
