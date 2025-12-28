const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stellar_tokens',
});

async function fix() {
    await client.connect();
    console.log('Checking/Dropping multisig_transactions table...');
    await client.query('DROP TABLE IF EXISTS "multisig_transactions" CASCADE;');
    console.log('Dropped table.');

    console.log('Checking/Dropping MultiSigTxStatus type...');
    await client.query('DROP TYPE IF EXISTS "MultiSigTxStatus" CASCADE;');
    console.log('Dropped type.');

    await client.end();
}

fix().catch(e => {
    console.error(e);
    process.exit(1);
});
