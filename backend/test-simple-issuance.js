import { Horizon, Keypair, Asset, Operation, TransactionBuilder, BASE_FEE, Networks } from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
console.log(`Creating fresh Horizon.Server for: ${horizonUrl}`);
const server = new Horizon.Server(horizonUrl);

const issuerSecret = process.env.ISSUER_SECRET_KEY;
const distributorSecret = process.env.DISTRIBUTOR_SECRET_KEY;
const operationsSecret = process.env.OPERATIONS_SECRET_KEY;

const issuerKeypair = Keypair.fromSecret(issuerSecret);
const distributorKeypair = Keypair.fromSecret(distributorSecret);
const operationsKeypair = Keypair.fromSecret(operationsSecret);

console.log(`Issuer: ${issuerKeypair.publicKey()}`);
console.log(`Distributor: ${distributorKeypair.publicKey()}`);
console.log(`Operations: ${operationsKeypair.publicKey()}`);

async function testIssuance() {
    const assetCode = 'T' + Date.now().toString().slice(-4);
    console.log(`\n=== Testing issuance for asset: ${assetCode} ===\n`);

    try {
        // 1. Load accounts
        console.log('Step 1: Loading issuer account...');
        const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
        console.log(`  Issuer sequence: ${issuerAccount.sequenceNumber()}`);

        console.log('Step 2: Loading distributor account...');
        const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
        console.log(`  Distributor sequence: ${distributorAccount.sequenceNumber()}`);

        const asset = new Asset(assetCode, issuerKeypair.publicKey());
        console.log(`  Asset: ${assetCode}:${issuerKeypair.publicKey()}`);

        // 2. Check if distributor has trustline
        const trustline = distributorAccount.balances.find(
            b => b.asset_code === assetCode && b.asset_issuer === issuerKeypair.publicKey()
        );

        if (!trustline) {
            console.log('\nStep 3: Creating trustline for distributor...');
            const trustOp = Operation.changeTrust({ asset, source: distributorKeypair.publicKey() });

            const trustTx = new TransactionBuilder(distributorAccount, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET,
            })
                .addOperation(trustOp)
                .setTimeout(30)
                .build();

            trustTx.sign(distributorKeypair);

            // Fee bump with operations account
            console.log('  Building fee bump...');
            const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
                operationsKeypair,
                BASE_FEE,
                trustTx,
                Networks.TESTNET
            );
            feeBumpTx.sign(operationsKeypair);

            console.log('  Submitting trustline transaction...');
            const trustResult = await server.submitTransaction(feeBumpTx);
            console.log(`  Trustline created: ${trustResult.hash}`);

            // Wait for ledger
            console.log('  Waiting 10 seconds for ledger...');
            await new Promise(r => setTimeout(r, 10000));
            console.log('  Wait complete.');
        }

        // 3. Reload accounts with fresh sequence numbers
        console.log('\nStep 4: Reloading accounts (with fresh server)...');
        // Create a fresh server instance to avoid any connection issues
        const freshServer = new Horizon.Server(horizonUrl);
        const freshIssuerAccount = await freshServer.loadAccount(issuerKeypair.publicKey());
        console.log(`  Issuer sequence: ${freshIssuerAccount.sequenceNumber()}`);

        // 4. Issue tokens 
        console.log('\nStep 5: Issuing tokens...');
        const paymentOp = Operation.payment({
            destination: distributorKeypair.publicKey(),
            asset: asset,
            amount: '1000',
            source: issuerKeypair.publicKey(),
        });

        const issueTx = new TransactionBuilder(freshIssuerAccount, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET,
        })
            .addOperation(paymentOp)
            .setTimeout(30)
            .build();

        issueTx.sign(issuerKeypair);

        // Fee bump
        const issueFeeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
            operationsKeypair,
            BASE_FEE,
            issueTx,
            Networks.TESTNET
        );
        issueFeeBumpTx.sign(operationsKeypair);

        console.log('  Submitting issuance transaction...');
        const issueResult = await freshServer.submitTransaction(issueFeeBumpTx);
        console.log(`  Tokens issued!`);
        console.log(`  Hash: ${issueResult.hash}`);
        console.log(`  Ledger: ${issueResult.ledger}`);

        console.log('\n=== SUCCESS ===');

    } catch (error) {
        console.error('\n=== FAILURE ===');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            if (error.response.data) {
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
            }
        }
        process.exit(1);
    }
}

testIssuance();
