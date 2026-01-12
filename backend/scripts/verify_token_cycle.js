import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from project root (../../.env relative to backend/scripts/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import {
    stellarServer,
    getTreasuryKeypair,
    getDistributorKeypair,
    getOperationsKeypair,
    buildTransaction,
    signAndSubmitTransaction,
} from '../src/config/stellar.js';
import { Operation } from '@stellar/stellar-sdk';

const verifyCycle = async () => {
    console.log('--- Starting Token Cycle Verification (Gas Station Smoke Test) ---');

    const treasury = getTreasuryKeypair();
    const distributor = getDistributorKeypair();
    const operations = getOperationsKeypair();

    console.log('Treasury:', treasury.publicKey());
    console.log('Distributor:', distributor.publicKey());
    console.log('Operations:', operations.publicKey());

    const getBalance = async (pk) => {
        try {
            const account = await stellarServer.loadAccount(pk);
            const xlmInfo = account.balances.find(b => b.asset_type === 'native');
            return parseFloat(xlmInfo.balance);
        } catch (e) {
            console.error(`Error loading account ${pk}:`, e.message);
            return 0;
        }
    };

    const initialTreasuryBalance = await getBalance(treasury.publicKey());
    const initialOpsBalance = await getBalance(operations.publicKey());
    const initialDistBalance = await getBalance(distributor.publicKey());

    console.log('\n--- Initial Balances ---');
    console.log(`Treasury: ${initialTreasuryBalance} XLM`);
    console.log(`Operations: ${initialOpsBalance} XLM`);
    console.log(`Distributor: ${initialDistBalance} XLM`);

    // Send 1.0 XLM from Treasury to Distributor
    // Logic: Treasury signs the transfer. Operations should sign the Fee Bump.
    console.log('\n--- Executing Transfer: Treasury -> Distributor (1.0 XLM) ---');

    const paymentOp = Operation.payment({
        destination: distributor.publicKey(),
        asset: (await import('@stellar/stellar-sdk')).Asset.native(),
        amount: '1.0',
    });

    // Note: buildTransaction uses 'treasury' as source (inner tx source)
    const transaction = await buildTransaction(treasury, [paymentOp], { memo: 'GasStationTest' });

    // signAndSubmitTransaction should wrap this in Fee Bump paying with Operations
    const result = await signAndSubmitTransaction(transaction, treasury);

    if (!result.success) {
        console.error('Transaction Failed:', result);
        process.exit(1);
    }

    console.log('Transaction Success! Hash:', result.hash);

    console.log('Waiting 5 seconds for ledger ingestion...');
    await new Promise(r => setTimeout(r, 5000));

    const finalTreasuryBalance = await getBalance(treasury.publicKey());
    const finalOpsBalance = await getBalance(operations.publicKey());
    const finalDistBalance = await getBalance(distributor.publicKey());

    console.log('\n--- Final Balances ---');
    console.log(`Treasury: ${finalTreasuryBalance} XLM`);
    console.log(`Operations: ${finalOpsBalance} XLM`);
    console.log(`Distributor: ${finalDistBalance} XLM`);

    const treasuryCost = initialTreasuryBalance - finalTreasuryBalance;
    const opsCost = initialOpsBalance - finalOpsBalance;

    console.log('\n--- Verification ---');
    console.log(`Treasury Cost: ${treasuryCost.toFixed(7)} XLM (Expected 1.0)`);
    console.log(`Operations Cost: ${opsCost.toFixed(7)} XLM (Expected > 0)`);

    // Assertions
    // Treasury should have paid exactly 1.0
    if (Math.abs(treasuryCost - 1.0) < 0.000001) {
        console.log('✅ PASS: Treasury paid exactly the transfer amount (0 fees).');
    } else {
        console.log('❌ FAIL: Treasury paid fees? Cost:', treasuryCost);
    }

    // Operations should have paid something
    if (opsCost > 0) {
        console.log('✅ PASS: Operations wallet paid the gas!');
    } else {
        console.log('❌ FAIL: Operations wallet did not pay gas. Cost:', opsCost);
    }
};

verifyCycle().catch(console.error);
