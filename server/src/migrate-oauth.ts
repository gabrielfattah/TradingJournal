import { db } from './models/database';

console.log('Starting database migration for OAuth support...');

try {
  // Add email column if it doesn't exist
  db.exec(`
    ALTER TABLE users ADD COLUMN email TEXT;
  `);
  console.log('✓ Added email column');
} catch (e) {
  console.log('• email column already exists');
}

try {
  // Add google_id column if it doesn't exist
  db.exec(`
    ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
  `);
  console.log('✓ Added google_id column');
} catch (e) {
  console.log('• google_id column already exists');
}

try {
  // Add auth_provider column if it doesn't exist
  db.exec(`
    ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local';
  `);
  console.log('✓ Added auth_provider column');
} catch (e) {
  console.log('• auth_provider column already exists');
}

// Update existing users to have 'local' as auth_provider
try {
  db.exec(`
    UPDATE users
    SET auth_provider = 'local'
    WHERE auth_provider IS NULL;
  `);
  console.log('✓ Updated existing users to local auth provider');
} catch (e) {
  console.log('• Could not update auth_provider:', e);
}

console.log('\n✓ Migration complete!');
console.log('Your database now supports both local and Google OAuth authentication.\n');

process.exit(0);
