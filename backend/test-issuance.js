
import { StellarService } from './src/services/stellar.service.js';
import { Keypair } from '@stellar/stellar-sdk';

async function testIssuance() {
    const assetCode = 'TEST' + Math.floor(Math.random() * 1000);
    console.log(`Testing issuance for asset: ${assetCode}`);
    try {
        const result = await StellarService.issueSecurityToken(assetCode, "1000", { homeDomain: 'stellar-tokens.local' });
        console.log('SUCCESS:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('FAILURE:', e.message);
        if (e.cause && e.cause.response && e.cause.response.data) {
            console.error('EXTRA:', JSON.stringify(e.cause.response.data.extras, null, 2));
        } else if (e.response && e.response.data) {
            console.error('EXTRA:', JSON.stringify(e.response.data.extras, null, 2));
        }
        process.exit(1);
    }
}

testIssuance();
