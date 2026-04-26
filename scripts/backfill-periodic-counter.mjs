/**
 * One-time backfill script for periodicPaymentsCompleted counter.
 *
 * Counts distinct paymentDate values per offer from InterestPayment records
 * and sets the counter on each active periodic offer.
 *
 * Usage: node scripts/backfill-periodic-counter.mjs
 * Run AFTER: npx prisma migrate dev --name add_periodic_payments_counter
 * Run BEFORE: deploying new code that reads the counter
 */
import prisma from '../backend/src/config/prisma.js';

const offers = await prisma.offer.findMany({
    where: {
        paymentType: { not: 'bullet' },
        status: { in: ['active'] },
    },
    select: { id: true, offerName: true, periodicPaymentsCompleted: true },
});

console.log(`Found ${offers.length} active periodic offers to backfill.\\n`);

for (const offer of offers) {
    const rounds = await prisma.interestPayment.groupBy({
        by: ['paymentDate'],
        where: { offerId: offer.id, status: 'completed' },
    });
    const count = rounds.length;

    if (offer.periodicPaymentsCompleted !== count) {
        await prisma.offer.update({
            where: { id: offer.id },
            data: { periodicPaymentsCompleted: count },
        });
        console.log(`Offer ${offer.id} (${offer.offerName}): ${offer.periodicPaymentsCompleted} → ${count}`);
    } else {
        console.log(`Offer ${offer.id} (${offer.offerName}): already correct (${count})`);
    }
}

console.log(`\\nDone. Updated ${offers.length} offers.`);
console.log('Run the verification query next (see implementation_plan.md → Change 0).');
await prisma.$disconnect();
