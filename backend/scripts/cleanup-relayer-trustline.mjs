/**
 * Remove a zombie trustline from an investor relayer G-account.
 *
 * Why: when REQUIRED_TRUSTLINE_ASSETS evolves or the canonical issuer changes
 * (e.g. mainnet → testnet USDC), the relayer keeps the stale trustline AND a
 * 0.5 XLM sponsored reserve. The runtime self-heal adds the new trustline but
 * doesn't remove the old one. This script does the cleanup safely.
 *
 * Safety: refuses to remove a trustline with non-zero balance.
 *
 * Usage (from repo root):
 *   docker exec stellar_backend node /app/backend/scripts/cleanup-relayer-trustline.mjs \
 *       <RELAYER_G_ADDRESS> <ASSET_CODE> <ISSUER_G_ADDRESS>
 *
 * Example:
 *   docker exec stellar_backend node /app/backend/scripts/cleanup-relayer-trustline.mjs \
 *       GCZUVGZZBUTD5W6NEOWIF2HLC2NYFMSJIRCANCHPCV5TXEXLMSUZNHNQ \
 *       USDC \
 *       GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
 */
import {
    Asset, TransactionBuilder, Operation, BASE_FEE,
} from '@stellar/stellar-sdk';
import {
    stellarServer, getNetworkPassphrase, getOperationsKeypair,
} from '../src/config/stellar.js';
import prisma from '../src/config/prisma.js';
import { PasskeyWalletService } from '../src/services/passkeyWallet.service.js';
import InvestorRelayerWalletService from '../src/services/investorRelayerWallet.service.js';

const [relayerPubKey, assetCode, issuer] = process.argv.slice(2);
if (!relayerPubKey || !assetCode || !issuer) {
    console.error('Usage: node cleanup-relayer-trustline.mjs <RELAYER_PUBKEY> <ASSET_CODE> <ISSUER>');
    process.exit(1);
}

async function main() {
    // 1. Verify trustline exists with 0 balance
    const account = await stellarServer.loadAccount(relayerPubKey);
    const trustline = account.balances.find(
        (b) => b.asset_code === assetCode && b.asset_issuer === issuer
    );
    if (!trustline) {
        console.log(`No trustline for ${assetCode}:${issuer.slice(0, 8)}… on ${relayerPubKey.slice(0, 8)}… — nothing to do`);
        return;
    }
    if (Number(trustline.balance) !== 0) {
        console.error(`REFUSED: trustline has non-zero balance ${trustline.balance} ${assetCode}. Withdraw first.`);
        process.exit(1);
    }
    console.log(`Trustline found: ${assetCode}:${issuer.slice(0, 8)}… balance=0 sponsor=${trustline.sponsor ?? 'none'}`);

    // 2. Resolve the relayer's investor row → decrypt keypair
    const row = await prisma.investorRelayerWallet.findUnique({ where: { publicKey: relayerPubKey } });
    if (!row) {
        console.error(`No investorRelayerWallet row for publicKey ${relayerPubKey}`);
        process.exit(1);
    }
    const relayerKeypair = await InvestorRelayerWalletService.getKeypair(row.investorId);

    // 3. Build sponsored ChangeTrust(limit=0) tx
    // The relayer SIGNS the ChangeTrust (it owns the trustline). Ops pays the fee.
    // Removing a sponsored trustline returns the 0.5 XLM reserve to the sponsor.
    const opsKeypair = getOperationsKeypair();
    const networkPassphrase = getNetworkPassphrase();
    const opsAccount = await stellarServer.loadAccount(opsKeypair.publicKey());
    const tx = new TransactionBuilder(opsAccount, {
        fee: String(BASE_FEE * 2),
        networkPassphrase,
    })
        .addOperation(Operation.changeTrust({
            asset: new Asset(assetCode, issuer),
            limit: '0',
            source: relayerPubKey,
        }))
        .setTimeout(180)
        .build();

    tx.sign(opsKeypair, relayerKeypair);
    console.log('Submitting ChangeTrust(limit=0) — fee=ops, signer=relayer…');
    const result = await PasskeyWalletService.sendTransaction(tx);
    console.log(`✅ Removed. tx=${result.hash}`);
    console.log(`   View: https://stellar.expert/explorer/testnet/tx/${result.hash}`);

    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error('FAILED:', err.message);
    if (err.response?.data) console.error('Horizon body:', JSON.stringify(err.response.data, null, 2));
    await prisma.$disconnect();
    process.exit(1);
});
