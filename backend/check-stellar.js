
import { Keypair, Horizon } from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

import { keyManager } from './src/services/KeyManager.js';

const roles = ['ISSUER', 'DISTRIBUTOR', 'OPERATIONS', 'TREASURY'];

async function check() {
    for (const role of roles) {
        try {
            const pub = keyManager.getPublicKey(role);
            console.log(`Checking ${role}: ${pub}`);
            const acc = await server.loadAccount(pub);
            console.log(`  Balance: ${acc.balances.find(b => b.asset_type === 'native').balance} XLM`);
        } catch (e) {
            console.log(`  Error for ${role}: ${e.message}`);
        }
    }
}

check();
