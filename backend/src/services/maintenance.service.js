import prisma from '../config/prisma.js';
import { StellarService } from './stellar.service.js';
import cron from 'node-cron';

export class MaintenanceService {
    static TTL_THRESHOLD = 50000; // ~3.5 days at 6s ledgers
    static EXTEND_AMOUNT = 500000; // ~1 month

    /**
     * Initializes the maintenance cron jobs
     */
    static init() {
        console.log('[MaintenanceService] Initializing maintenance schedules...');

        // Run daily at 3 AM
        cron.schedule('0 3 * * *', async () => {
            console.log('[MaintenanceService] Running daily TTL maintenance check...');
            try {
                await this.checkAndExtendAllTTLs();
            } catch (error) {
                console.error('[MaintenanceService] Daily maintenance failed:', error);
            }
        });

        // Run once on startup after 30 seconds delay to not interfere with boot
        setTimeout(() => {
            this.checkAndExtendAllTTLs().catch(err =>
                console.error('[MaintenanceService] Startup maintenance failed:', err)
            );
        }, 30000);
    }

    /**
     * Iterates through all project-related Soroban entries and extends TTL if needed
     */
    static async checkAndExtendAllTTLs() {
        console.log('[MaintenanceService] Starting TTL extension sweep...');

        const contractsToCheck = [];

        // 1. Get all Tokens with SACs
        const tokens = await prisma.token.findMany({
            where: { sacContractId: { not: null } },
            select: { assetCode: true, sacContractId: true }
        });

        for (const token of tokens) {
            contractsToCheck.push({
                id: token.sacContractId,
                name: `SAC (${token.assetCode})`,
                type: 'token'
            });
        }

        // 2. Get all Investors with Smart Wallets
        const investors = await prisma.investor.findMany({
            where: { stellarContractId: { startsWith: 'C' } },
            select: { name: true, stellarContractId: true }
        });

        for (const investor of investors) {
            contractsToCheck.push({
                id: investor.stellarContractId,
                name: `Wallet (${investor.name})`,
                type: 'investor'
            });
        }

        console.log(`[MaintenanceService] Found ${contractsToCheck.length} contracts to audit.`);

        let successCount = 0;
        let extendedCount = 0;
        let failCount = 0;

        for (const contract of contractsToCheck) {
            try {
                const ttlInfo = await StellarService.getContractTTL(contract.id);

                if (!ttlInfo.exists) {
                    console.warn(`[MaintenanceService] Contract ${contract.name} (${contract.id}) not found on-chain.`);
                    failCount++;
                    continue;
                }

                if (ttlInfo.ttlRemaining < this.TTL_THRESHOLD) {
                    console.log(`[MaintenanceService] LOW TTL for ${contract.name}: ${ttlInfo.ttlRemaining}. Extending...`);
                    await StellarService.extendContractTTL(contract.id, this.EXTEND_AMOUNT);
                    extendedCount++;
                }

                successCount++;
            } catch (error) {
                console.error(`[MaintenanceService] Error processing ${contract.name}:`, error.message);
                failCount++;
            }
        }

        console.log(`[MaintenanceService] Sweep completed. Audited: ${successCount}, Extended: ${extendedCount}, Errors: ${failCount}`);
    }
}
