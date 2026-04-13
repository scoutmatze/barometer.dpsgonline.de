
import { Pool } from 'pg';
import { hash } from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://dpsg:password@localhost:5432/dpsg_barometer',
});

async function seed() {
  const pin = process.argv[2] || '1234';
  const email = process.argv[3] || 'mathias.meyer@dpsg1300.de';
  const name = process.argv[4] || 'Mathias Meyer';

  const pinHash = await hash(pin, 12);

  // Upsert admin user
  await pool.query(`
    INSERT INTO users (email, name, pin_hash, role)
    VALUES ($1, $2, $3, 'ADMIN')
    ON CONFLICT (email) DO UPDATE SET pin_hash = $3, name = $2, role = 'ADMIN'
  `, [email.toLowerCase(), name, pinHash]);

  console.log('Admin user created/updated:');
  console.log('  Email:', email);
  console.log('  PIN:', pin);
  console.log('  Role: ADMIN');

  // Check if we should add demo BL user
  if (process.argv.includes('--demo')) {
    const demoHash = await hash('5678', 12);
    await pool.query(`
      INSERT INTO users (email, name, pin_hash, role)
      VALUES ('bl@dpsg1300.de', 'BL Demo', $1, 'BL')
      ON CONFLICT (email) DO UPDATE SET pin_hash = $1
    `, [demoHash]);
    console.log('\nDemo BL user created:');
    console.log('  Email: bl@dpsg1300.de');
    console.log('  PIN: 5678');
    console.log('  Role: BL');
  }

  await pool.end();
  console.log('\nDone!');
}

seed().catch(console.error);
