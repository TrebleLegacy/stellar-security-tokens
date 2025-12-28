#!/usr/bin/env node
import dotenv from 'dotenv';
import { ipfsService } from '../src/services/ipfs.service.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

console.log('🔧 Testing Pinata IPFS Connection...\n');

// Check if credentials are loaded
if (!process.env.PINATA_JWT && (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY)) {
    console.error('❌ ERROR: Pinata credentials not found in .env file');
    console.log('Expected:');
    console.log('  PINATA_JWT=...');
    console.log('  (Legacy PINATA_API_KEY/SECRET_API_KEY are no longer supported by pinata-web3)');
    process.exit(1);
}

if (process.env.PINATA_JWT) {
    console.log('✅ Pinata JWT loaded from .env');
    console.log('   JWT:', process.env.PINATA_JWT.substring(0, 10) + '...');
} else {
    console.log('⚠️  Only legacy Pinata keys found. IPFS service will run in mock mode.');
}
console.log('');

// Test authentication
try {
    const isAuthenticated = await ipfsService.testConnection();

    if (isAuthenticated) {
        console.log('✅ Successfully authenticated with Pinata!');
        console.log('   IPFS uploads are now ENABLED');
        console.log('');
        console.log('📤 You can now:');
        console.log('   - Upload legal documents via the /api/companies/offers endpoint');
        console.log('   - Documents will be stored on IPFS via Pinata');
        console.log('   - Retrieve documents using the IPFS gateway URLs');
    } else {
        console.log('❌ Authentication failed - credentials may be invalid');
        console.log('   Check your Pinata API Key and Secret');
    }
} catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
}
