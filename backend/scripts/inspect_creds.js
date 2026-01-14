
import prisma from '../src/config/prisma.js';

async function inspectCredentials() {
    console.log('--- Investor Credentials ---');
    const investorCreds = await prisma.investorWebauthnCredential.findMany({
        include: { investor: true }
    });

    investorCreds.forEach(cred => {
        console.log(`ID: ${cred.id}`);
        console.log(`Investor: ${cred.investor?.email}`);
        console.log(`Credential ID (abbr): ${cred.credentialId.substring(0, 20)}...`);
        console.log(`Counter: ${cred.counter}`);
        console.log(`Created At: ${cred.createdAt}`);
        console.log(`Last Used: ${cred.lastUsedAt}`);
        console.log('-------------------');
    });

    console.log('\n--- Company User Credentials ---');
    const companyCreds = await prisma.companyUserWebauthnCredential.findMany({
        include: { companyUser: true }
    });

    companyCreds.forEach(cred => {
        console.log(`ID: ${cred.id}`);
        console.log(`Company User: ${cred.companyUser?.email}`);
        console.log(`Credential ID (abbr): ${cred.credentialId.substring(0, 20)}...`);
        console.log(`Counter: ${cred.counter}`);
        console.log(`Created At: ${cred.createdAt}`);
        console.log(`Last Used: ${cred.lastUsedAt}`);
        console.log('-------------------');
    });

    console.log('\n--- Direct Investor Credentials Columns ---');
    const investors = await prisma.investor.findMany({
        where: { passkeyCredentialId: { not: null } }
    });
    investors.forEach(inv => {
        console.log(`Inv ID: ${inv.id} | Email: ${inv.email}`);
        console.log(`Cred ID: ${inv.passkeyCredentialId ? inv.passkeyCredentialId.substring(0, 20) : 'null'}...`);
    });

    console.log('\n--- Direct Company User Credentials Columns ---');
    const companyUsers = await prisma.companyUser.findMany({
        where: { passkeyCredentialId: { not: null } }
    });
    companyUsers.forEach(cu => {
        console.log(`CU ID: ${cu.id} | Email: ${cu.email}`);
        console.log(`Cred ID: ${cu.passkeyCredentialId ? cu.passkeyCredentialId.substring(0, 20) : 'null'}...`);
    });
}

inspectCredentials()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
