import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Unit tests for payment batching logic
 *
 * Tests the batch-splitting behavior of createPaymentTransaction
 * without touching the network or database. Pure logic verification.
 *
 * Run: node --import tsx --test backend/tests/unit/paymentBatching.test.js
 */

const MAX_INVESTORS_PER_BATCH = 49;
const round7 = v => Math.round(v * 10_000_000) / 10_000_000;

/**
 * Simulate the batch-splitting logic from createPaymentTransaction lines 517-570.
 * This is an extracted, testable version of the production code.
 */
function simulateBatchSplit(allInvestors, coveredWallets = new Set()) {
  // Filter already-covered investors (wallets processed in previous batches)
  let remaining = allInvestors.filter(b => !coveredWallets.has(b.investorWallet));

  // Cap at MAX_INVESTORS_PER_BATCH
  const batch = remaining.slice(0, MAX_INVESTORS_PER_BATCH);
  const leftOver = remaining.slice(MAX_INVESTORS_PER_BATCH);

  return { batch, leftOver, remaining };
}

/**
 * Simulate spread fee recalculation for a batch subset.
 * Production code: lines 559-569
 */
function recalcBatchFee(batch, bulletDetails) {
  const batchInvestorInterest = batch.reduce((sum, b) => sum + b.interest, 0);
  const batchInvestorPayout = batch.reduce((sum, b) => sum + b.totalPayout, 0);

  const spreadRatio = bulletDetails.totalInterest > 0
    ? (bulletDetails.companyTotalInterest - bulletDetails.totalInterest) / bulletDetails.totalInterest
    : 0;

  const platformFee = round7(Math.max(0, batchInvestorInterest * spreadRatio));
  const totalAmount = batchInvestorPayout + platformFee;

  return { platformFee, totalAmount, batchInvestorPayout };
}

/** Generate N mock investors with proportional allocation */
function generateInvestors(count, totalInvested = 10000, annualRate = 12, investorRate = 10) {
  const perInvestor = totalInvested / count;
  const years = 1;
  const investorInterestPer = round7(perInvestor * (investorRate / 100) * years);

  return Array.from({ length: count }, (_, i) => ({
    investorId: i + 1,
    investorWallet: `GABCDEF${String(i).padStart(50, '0')}`,
    investorName: `Investor ${i + 1}`,
    principal: perInvestor,
    interest: investorInterestPer,
    totalPayout: round7(perInvestor + investorInterestPer),
  }));
}

function makeBulletDetails(investors, annualRate = 12, investorRate = 10) {
  const totalInvested = investors.reduce((s, i) => s + i.principal, 0);
  const totalInterest = investors.reduce((s, i) => s + i.interest, 0);
  const years = 1;
  const companyTotalInterest = round7(totalInvested * (annualRate / 100) * years);

  return {
    totalPrincipal: totalInvested,
    totalInterest: round7(totalInterest),
    companyTotalInterest,
    totalPayout: round7(totalInvested + totalInterest),
    breakdown: investors,
  };
}

// ═══════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════

describe('Payment Batching — MAX_INVESTORS_PER_BATCH = 49', () => {

  it('single batch: ≤49 investors are not split', () => {
    const investors = generateInvestors(30);
    const { batch, leftOver } = simulateBatchSplit(investors);

    assert.equal(batch.length, 30, 'All 30 investors in one batch');
    assert.equal(leftOver.length, 0, 'No leftover');
  });

  it('exact boundary: 49 investors fit in one batch', () => {
    const investors = generateInvestors(49);
    const { batch, leftOver } = simulateBatchSplit(investors);

    assert.equal(batch.length, 49, 'All 49 fit in one batch');
    assert.equal(leftOver.length, 0, 'No leftover');
  });

  it('split: 50 investors → 49 + 1', () => {
    const investors = generateInvestors(50);
    const { batch, leftOver } = simulateBatchSplit(investors);

    assert.equal(batch.length, 49, 'First batch: 49');
    assert.equal(leftOver.length, 1, 'Leftover: 1');
  });

  it('split: 100 investors → 49 + 51 remaining', () => {
    const investors = generateInvestors(100);
    const { batch, leftOver } = simulateBatchSplit(investors);

    assert.equal(batch.length, 49, 'First batch: 49');
    assert.equal(leftOver.length, 51, 'Leftover: 51');

    // Second batch
    const { batch: batch2, leftOver: leftOver2 } = simulateBatchSplit(leftOver);
    assert.equal(batch2.length, 49, 'Second batch: 49');
    assert.equal(leftOver2.length, 2, 'Leftover: 2');

    // Third batch
    const { batch: batch3, leftOver: leftOver3 } = simulateBatchSplit(leftOver2);
    assert.equal(batch3.length, 2, 'Third batch: 2');
    assert.equal(leftOver3.length, 0, 'No more leftover');
  });

  it('covered wallets filter: excludes already-batched investors', () => {
    const investors = generateInvestors(60);
    const covered = new Set(investors.slice(0, 20).map(i => i.investorWallet));

    const { batch, remaining } = simulateBatchSplit(investors, covered);

    assert.equal(remaining.length, 40, '60 - 20 covered = 40 remaining');
    assert.equal(batch.length, 40, '40 ≤ 49, all fit in one batch');
    // Verify none of the covered wallets are in the batch
    for (const inv of batch) {
      assert.ok(!covered.has(inv.investorWallet), `${inv.investorWallet} should NOT be in batch`);
    }
  });

  it('covered wallets + split: 100 investors, 30 covered → first batch 49, leftover 21', () => {
    const investors = generateInvestors(100);
    const covered = new Set(investors.slice(0, 30).map(i => i.investorWallet));

    const { batch, leftOver, remaining } = simulateBatchSplit(investors, covered);

    assert.equal(remaining.length, 70, '100 - 30 covered = 70 remaining');
    assert.equal(batch.length, 49, 'Capped at 49');
    assert.equal(leftOver.length, 21, '70 - 49 = 21 leftover');
  });

  it('empty after cover: all investors already covered → empty batch', () => {
    const investors = generateInvestors(10);
    const covered = new Set(investors.map(i => i.investorWallet));

    const { batch } = simulateBatchSplit(investors, covered);
    assert.equal(batch.length, 0, 'All covered = empty batch');
  });
});

describe('Batch Fee Recalculation', () => {

  it('batch fee is proportional to batch size', () => {
    const allInvestors = generateInvestors(100);
    const bulletDetails = makeBulletDetails(allInvestors);

    // First batch of 49
    const batch1 = allInvestors.slice(0, 49);
    const fee1 = recalcBatchFee(batch1, bulletDetails);

    // Second batch of 49
    const batch2 = allInvestors.slice(49, 98);
    const fee2 = recalcBatchFee(batch2, bulletDetails);

    // Third batch of 2
    const batch3 = allInvestors.slice(98);
    const fee3 = recalcBatchFee(batch3, bulletDetails);

    // Equal-size batches should have equal fees (since all investors are equal)
    assert.equal(fee1.platformFee, fee2.platformFee, 'Equal batches → equal fees');

    // Sum of batch fees should equal total fee
    const totalFee = recalcBatchFee(allInvestors, bulletDetails);
    const batchFeeSum = round7(fee1.platformFee + fee2.platformFee + fee3.platformFee);
    assert.ok(
      Math.abs(batchFeeSum - totalFee.platformFee) < 0.0000002,
      `Batch fee sum (${batchFeeSum}) ≈ total fee (${totalFee.platformFee})`,
    );
  });

  it('batch payout sum equals total payout', () => {
    const allInvestors = generateInvestors(100);
    const bulletDetails = makeBulletDetails(allInvestors);

    const batch1 = allInvestors.slice(0, 49);
    const batch2 = allInvestors.slice(49, 98);
    const batch3 = allInvestors.slice(98);

    const fee1 = recalcBatchFee(batch1, bulletDetails);
    const fee2 = recalcBatchFee(batch2, bulletDetails);
    const fee3 = recalcBatchFee(batch3, bulletDetails);

    const batchPayoutSum = round7(fee1.batchInvestorPayout + fee2.batchInvestorPayout + fee3.batchInvestorPayout);
    assert.ok(
      Math.abs(batchPayoutSum - bulletDetails.totalPayout) < 0.0000002,
      `Batch payout sum (${batchPayoutSum}) ≈ total (${bulletDetails.totalPayout})`,
    );
  });

  it('zero-interest investors: spread fee is 0', () => {
    const investors = generateInvestors(10).map(i => ({
      ...i,
      interest: 0,
      totalPayout: i.principal,
    }));
    const bulletDetails = makeBulletDetails(investors, 0, 0);

    const { platformFee } = recalcBatchFee(investors, bulletDetails);
    assert.equal(platformFee, 0, 'Zero interest → zero spread fee');
  });

  it('spread ratio preserved across batches', () => {
    const allInvestors = generateInvestors(100, 10000, 12, 10);
    const bulletDetails = makeBulletDetails(allInvestors, 12, 10);

    // Expected spread ratio = (companyInterest - investorInterest) / investorInterest
    const expectedRatio = (bulletDetails.companyTotalInterest - bulletDetails.totalInterest) / bulletDetails.totalInterest;

    // Verify each batch uses the same ratio
    for (let i = 0; i < 100; i += 49) {
      const batch = allInvestors.slice(i, i + 49);
      const batchInterest = batch.reduce((s, b) => s + b.interest, 0);
      const { platformFee } = recalcBatchFee(batch, bulletDetails);

      const batchRatio = batchInterest > 0 ? platformFee / batchInterest : 0;
      assert.ok(
        Math.abs(batchRatio - expectedRatio) < 0.0001,
        `Batch starting at ${i}: ratio ${batchRatio} ≈ ${expectedRatio}`,
      );
    }
  });
});

describe('Stellar Operation Count Validation', () => {

  it('49 investors: 1 fee + 49 pay + 49 clawback = 99 ops < 100', () => {
    const investors = generateInvestors(49);
    const feeOp = 1;       // treasury payment
    const payOps = investors.length;   // investor payments
    const clawOps = investors.length;  // clawback ops

    const totalOps = feeOp + payOps + clawOps;
    assert.equal(totalOps, 99, '49 investors → 99 ops');
    assert.ok(totalOps < 100, 'Under Stellar 100-op limit');
  });

  it('50 investors would exceed: 1 + 50 + 50 = 101 > 100', () => {
    const investors = generateInvestors(50);
    const totalOps = 1 + investors.length + investors.length;
    assert.equal(totalOps, 101, '50 investors → 101 ops');
    assert.ok(totalOps > 100, 'Exceeds Stellar limit → must batch');
  });

  it('0 fee (spread=0): 49 pay + 49 clawback = 98 ops', () => {
    const investors = generateInvestors(49);
    const feeOp = 0;       // no fee when spread = 0
    const totalOps = feeOp + investors.length + investors.length;
    assert.equal(totalOps, 98, 'No fee → 98 ops');
    assert.ok(totalOps < 100, 'Still under limit');
  });
});

describe('Batch Iteration Simulation', () => {

  it('130 investors → 3 batches (49 + 49 + 32)', () => {
    const allInvestors = generateInvestors(130);
    const covered = new Set();
    const batches = [];

    let remaining = allInvestors;
    while (remaining.length > 0) {
      const { batch, leftOver } = simulateBatchSplit(remaining);
      if (batch.length === 0) break;
      batches.push(batch);
      batch.forEach(i => covered.add(i.investorWallet));
      remaining = leftOver;
    }

    assert.equal(batches.length, 3, '130 investors → 3 batches');
    assert.equal(batches[0].length, 49, 'Batch 1: 49');
    assert.equal(batches[1].length, 49, 'Batch 2: 49');
    assert.equal(batches[2].length, 32, 'Batch 3: 32');

    // Total investors across all batches
    const totalProcessed = batches.reduce((s, b) => s + b.length, 0);
    assert.equal(totalProcessed, 130, 'All 130 investors processed');

    // No duplicates
    const allWallets = batches.flat().map(i => i.investorWallet);
    assert.equal(allWallets.length, new Set(allWallets).size, 'No duplicate wallets');
  });

  it('batchInfo.remaining is correct per batch', () => {
    const allInvestors = generateInvestors(100);
    const bulletDetails = makeBulletDetails(allInvestors);
    const totalInvestors = bulletDetails.breakdown.length;

    let remaining = allInvestors;
    let processedSoFar = 0;
    const batchInfos = [];

    while (remaining.length > 0) {
      const { batch, leftOver } = simulateBatchSplit(remaining);
      if (batch.length === 0) break;
      processedSoFar += batch.length;

      batchInfos.push({
        thisCount: batch.length,
        remaining: Math.max(0, totalInvestors - processedSoFar),
        hasMore: leftOver.length > 0,
      });

      remaining = leftOver;
    }

    // First batch: 49 done, 51 remaining
    assert.equal(batchInfos[0].thisCount, 49);
    assert.equal(batchInfos[0].remaining, 51);
    assert.ok(batchInfos[0].hasMore);

    // Second batch: 49 done, 2 remaining
    assert.equal(batchInfos[1].thisCount, 49);
    assert.equal(batchInfos[1].remaining, 2);
    assert.ok(batchInfos[1].hasMore);

    // Third batch: 2 done, 0 remaining
    assert.equal(batchInfos[2].thisCount, 2);
    assert.equal(batchInfos[2].remaining, 0);
    assert.ok(!batchInfos[2].hasMore);
  });
});
