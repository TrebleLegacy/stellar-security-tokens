
import { Keypair, Networks, Horizon, Asset, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { distributeTokens } from '../src/controllers/tokenController.js';
import prisma from '../src/config/prisma.js';
import { getIssuerKeypair, getDistributorKeypair, getOperationsKeypair } from '../src/config/stellar.js';

// Setup Stellar Server
const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;

const TIMEOUT_INFINITE = 0;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fundAccount(publicKey, label) {
    console.log(`Funding ${label} (${publicKey})...`);
    try {
        await delay(2000); // Rate limit protection
        const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
        const json = await response.json();
        if (!response.ok) {
            console.log(`Friendbot response for ${label}:`, JSON.stringify(json));
        } else {
            console.log(`Funded ${label}. Hash: ${json.hash}`);
        }
    } catch (e) {
        console.log(`Funding ${label} error (might be network/exists):`, e.message);
    }
}

async function waitForAccount(publicKey, label) {
    let retries = 5;
    while (retries > 0) {
        try {
            return await server.loadAccount(publicKey);
        } catch (e) {
            retries--;
            console.log(`Waiting for ${label} to exist... (${retries} retries left)`);
            await delay(3000);
        }
    }
    throw new Error(`Account ${label} (${publicKey}) not found after retries.`);
}

async function run() {
    try {
        console.log("--- Starting E2E JIT Verification (Schema Fixed) ---");

        // 1. Get Real Keypairs
        const issuer = getIssuerKeypair();
        const distributor = getDistributorKeypair();
        const operations = getOperationsKeypair();

        console.log(`Issuer: ${issuer.publicKey()}`);

        // Fund them
        await fundAccount(issuer.publicKey(), "Issuer");
        await fundAccount(distributor.publicKey(), "Distributor");
        await fundAccount(operations.publicKey(), "Operations");

        // Wait for existence
        console.log("Waiting for accounts to sync...");
        const issuerAcc = await waitForAccount(issuer.publicKey(), "Issuer");
        await waitForAccount(distributor.publicKey(), "Distributor");
        await waitForAccount(operations.publicKey(), "Operations");
        console.log("All accounts active.");

        await delay(2000);

        // 2. Setup Asset
        const assetCode = "JIT" + Math.floor(Math.random() * 1000);
        const asset = new Asset(assetCode, issuer.publicKey());
        console.log(`Asset: ${assetCode}`);

        // Set Issuer Flags (Auth Required)
        try {
            await delay(1000);
            const account = await server.loadAccount(issuer.publicKey());
            let tx = new TransactionBuilder(account, { fee: '10000', networkPassphrase })
                .addOperation(Operation.setOptions({
                    setFlags: 1 // AUTHORIZATION REQUIRED
                }))
                .setTimeout(TIMEOUT_INFINITE)
                .build();
            tx.sign(issuer);
            await server.submitTransaction(tx);
            console.log("Issuer flags set (Auth Required).");
        } catch (e) {
            console.log("Issuer flags set failed (maybe already set or seq error):", e?.message);
        }

        // 3. Issue Asset to Distributor
        try {
            await delay(1000);
            const distAccount = await server.loadAccount(distributor.publicKey());
            let tx = new TransactionBuilder(distAccount, { fee: '10000', networkPassphrase })
                .addOperation(Operation.changeTrust({ asset }))
                .setTimeout(TIMEOUT_INFINITE)
                .build();
            tx.sign(distributor);
            await server.submitTransaction(tx);
            console.log("Distributor trustline established.");
        } catch (e) {
            console.log("Distributor trustline failed/skipped:", e?.message);
        }

        // Issuer Authorize Distributor
        try {
            await delay(1000);
            const issuerAccount = await server.loadAccount(issuer.publicKey());
            let tx = new TransactionBuilder(issuerAccount, { fee: '10000', networkPassphrase })
                .addOperation(Operation.setTrustLineFlags({
                    trustor: distributor.publicKey(),
                    asset: asset,
                    flags: { authorized: true },
                    source: issuer.publicKey()
                }))
                .setTimeout(TIMEOUT_INFINITE)
                .build();
            tx.sign(issuer);
            await server.submitTransaction(tx);
            console.log("Distributor Authorized.");
        } catch (e) {
            console.log("Distributor auth failed:", e?.message);
        }

        // Issue tokens
        try {
            await delay(1000);
            const issuerAccount = await server.loadAccount(issuer.publicKey());
            let tx = new TransactionBuilder(issuerAccount, { fee: '10000', networkPassphrase })
                .addOperation(Operation.payment({
                    destination: distributor.publicKey(),
                    asset: asset,
                    amount: '10000'
                }))
                .setTimeout(TIMEOUT_INFINITE)
                .build();
            tx.sign(issuer);
            await server.submitTransaction(tx);
            console.log("Tokens issued to Distributor.");
        } catch (e) {
            console.log("Issue tokens failed:", e?.message);
        }


        // 4. Setup Investor
        const investorParams = Keypair.random();
        console.log(`Investor: ${investorParams.publicKey()}`);
        await fundAccount(investorParams.publicKey(), "Investor");
        await waitForAccount(investorParams.publicKey(), "Investor");

        // Investor Trustline
        try {
            await delay(1000);
            const invAccount = await server.loadAccount(investorParams.publicKey());
            let tx = new TransactionBuilder(invAccount, { fee: '10000', networkPassphrase })
                .addOperation(Operation.changeTrust({ asset }))
                .setTimeout(TIMEOUT_INFINITE)
                .build();
            tx.sign(investorParams);
            await server.submitTransaction(tx);
            console.log("Investor trustline established (Unauthorized).");
        } catch (e) {
            console.error("Investor trustline failed:", e?.message);
            process.exit(1);
        }

        // 5. Create Token & Investor in DB
        // Use try/catch for Token to avoid duplicate key error if re-running same random seed (unlikely but safe)
        try {
            await prisma.token.create({
                data: {
                    assetCode: assetCode,
                    issuerPublicKey: issuer.publicKey(),
                    totalSupply: 10000,
                    description: 'E2E JIT Test'
                }
            });
        } catch (e) { console.log("Token create error (ignoring):", e.message); }

        const uniqueDoc = `DOC_${Date.now()}`;

        // Use raw SQL to insert Investor correctly (no stellar_public_key)
        // Storing G-Address in stellar_contract_id is technically misuse but required for schema compliance if publicKey is gone.
        // TokenController logic allows checking if contractId is defined.
        await prisma.$executeRaw`
            INSERT INTO investors (
                name, email, document, kyc_status, stellar_contract_id, created_at, updated_at
            ) VALUES (
                'E2E Investor', ${'e2e_' + Date.now() + '@test.com'}, ${uniqueDoc}, 'approved'::"KYCStatus", ${investorParams.publicKey()}, NOW(), NOW()
            )
        `;

        const investorRecordVal = await prisma.$queryRaw`SELECT id FROM investors WHERE document = ${uniqueDoc}`;
        const investorId = investorRecordVal[0].id;

        console.log("Investor created in DB, ID:", investorId);

        // 6. Call DistributeTokens
        console.log(">> calling distributeTokens...");
        const req = {
            body: {
                investorId: investorId,
                assetCode: assetCode,
                amount: '10'
            },
            user: { userId: 1 }
        };
        const res = {
            status: (code) => {
                if (code >= 400) console.log(`Response Status: ${code}`);
                return {
                    json: (data) => console.log(`Response Data:`, JSON.stringify(data))
                }
            },
            json: (data) => console.log(`Response Data:`, JSON.stringify(data))
        };
        const next = (e) => {
            console.error("Next Error:", e);
            if (e.response) console.error("Stellar Resp:", JSON.stringify(e.response.data));
        };

        // This should trigger JIT Auth + Distribution
        // Note: Controller uses JIT logic. If successful, it returns 201.
        await distributeTokens(req, res, next);

        // 7. Verify Blockchain State
        console.log("Verifying on-chain...");
        await delay(5000); // Wait for propagation after distribution

        const finalAccount = await server.loadAccount(investorParams.publicKey());
        const balance = finalAccount.balances.find(b => b.asset_code === assetCode);

        // Also check if Auth Flag is set on the trustline
        // Usually horizon returns 'is_authorized' boolean on balances in some versions, or flags int.
        // But if balance > 0, we MUST be authorized because issuer requires auth.

        if (balance && parseFloat(balance.balance) >= 10) {
            console.log("SUCCESS: Investor received tokens!");
            console.log("Balance:", balance.balance);
        } else {
            console.error("FAILURE: Investor did not receive tokens.", JSON.stringify(finalAccount.balances));
            process.exit(1);
        }

    } catch (e) {
        console.error("E2E Test Failed:", e);
        if (e.response) console.error("Stellar Error Detail:", JSON.stringify(e.response.data));
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

run();
