import { Horizon, Keypair } from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
console.log(`Horizon URL: ${horizonUrl}`);

const server = new Horizon.Server(horizonUrl);

const issuerSecret = process.env.ISSUER_SECRET_KEY;
const distributorSecret = process.env.DISTRIBUTOR_SECRET_KEY;

const issuerPub = Keypair.fromSecret(issuerSecret).publicKey();
const distributorPub = Keypair.fromSecret(distributorSecret).publicKey();

console.log(`Issuer: ${issuerPub}`);
console.log(`Distributor: ${distributorPub}`);

async function testLoading() {
    for (let i = 0; i < 10; i++) {
        console.log(`\n--- Attempt ${i + 1} ---`);
        try {
            const issuer = await server.loadAccount(issuerPub);
            console.log(`  Issuer loaded: seq=${issuer.sequenceNumber()}`);
        } catch (e) {
            console.log(`  Issuer FAILED: ${e.message}`);
        }

        try {
            const dist = await server.loadAccount(distributorPub);
            console.log(`  Distributor loaded: seq=${dist.sequenceNumber()}`);
        } catch (e) {
            console.log(`  Distributor FAILED: ${e.message}`);
        }

        await new Promise(r => setTimeout(r, 500));
    }
}

testLoading();
