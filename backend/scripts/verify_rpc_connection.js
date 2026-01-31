
import { StellarService } from '../src/services/stellar.service.js';
import process from 'node:process';

// Force Testnet for safety
process.env.STELLAR_NETWORK = 'testnet';
process.env.SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';

async function main() {
    console.log('🔍 Starting Live RPC Connection Verification...');
    console.log(`📡 Network: ${process.env.STELLAR_NETWORK}`);
    console.log(`🔗 RPC URL: ${process.env.SOROBAN_RPC_URL}`);

    // Known active Testnet account (Stellar Friendbot funded)
    // Using a random known public key or we can use the treasury if env is loaded
    // Let's use the official Friendbot account or a known genesis account if possible, 
    // but safer to use an account that definitely exists. 
    // Using the "Issuer" from the local env would be best if it exists.

    // We'll try to load the Treasury account from the environment credentials
    // If not available, we'll fail gracefully.

    try {
        const { getTreasuryKeypair } = await import('../src/config/stellar.js');
        const treasury = getTreasuryKeypair();
        const publicKey = treasury.publicKey();

        console.log(`\n👤 Testing with Treasury Account: ${publicKey}`);
        console.log('⏳ Fetching account data via StellarService.getAccountRPC()...');

        const account = await StellarService.getAccountRPC(publicKey);

        console.log('\n✅ RPC Connection Successful!');
        console.log(`   - Sequence Number: ${account.sequence}`);
        console.log(`   - Account ID: ${account.accountId()}`);

        // Verify it returns a proper Account object capable of transaction building
        if (typeof account.incrementSequenceNumber === 'function') {
            console.log('   - Object Integrity: OK (Has incrementSequenceNumber)');
        } else {
            console.error('   - Object Integrity: FAILED (Missing methods)');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ RPC Connection Failed!');
        console.error('   Reason:', error.message);
        if (error.message.includes('404')) {
            console.error('   (Account not found is "valid" RPC response, but implies account needs funding)');
        }
        process.exit(1);
    }
}

main();
