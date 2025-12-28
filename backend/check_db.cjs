const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stellar_tokens',
});

async function check() {
    await client.connect();
    const res = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications'
    );
  `);
    console.log('Notifications table exists:', res.rows[0].exists);

    const resEnum = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'MultiSigTxStatus'
    );
  `);
    console.log('MultiSigTxStatus enum exists:', resEnum.rows[0].exists);

    await client.end();
}

check().catch(e => {
    console.error(e);
    process.exit(1);
});
