import { Contract, Address, xdr, TransactionBuilder, BASE_FEE, Networks } from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';

const USDC_CONTRACT = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';
const INVESTOR_WALLET = 'CDDKGLB2N2TGZHOH3O4DO76AYUPEPTLLIKTNS2A7Z65ATP35YKVDJ4UP';
const OPS_PUBKEY = 'GCM4G4PS2L325FG2RDTPFWBBX6QL6FN6BTU6YNNQ6GNQVS67NFJFMZ3C';

async function main() {
    const rpc = new Server('https://soroban-testnet.stellar.org');
    const usdcContract = new Contract(USDC_CONTRACT);
    const investorAddr = Address.fromString(INVESTOR_WALLET);

    const balanceOp = usdcContract.call('balance', xdr.ScVal.scvAddress(investorAddr.toScAddress()));

    const account = await rpc.getAccount(OPS_PUBKEY);

    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(balanceOp)
        .setTimeout(30)
        .build();

    const sim = await rpc.simulateTransaction(tx);

    if (sim.error) {
        console.log('Simulation error:', sim.error);
        return;
    }

    if (sim.result) {
        const retval = sim.result.retval;
        console.log('Type:', retval.switch().name);
        // i128 value
        try {
            const parts = retval.value();
            const lo = BigInt(parts.lo().toXDR('hex'), 16);
            const hi = BigInt(parts.hi().toXDR('hex'), 16);
            console.log('hi:', hi.toString(), 'lo:', lo.toString());
            const val = hi * (2n ** 64n) + lo;
            console.log('Raw balance:', val.toString());
            console.log('USDC:', (Number(val) / 10_000_000).toFixed(7));
        } catch (e) {
            console.log('Parse error:', e.message);
            console.log('Raw XDR:', retval.toXDR('base64'));
        }
    }
}

main().catch(e => console.error('Error:', e.message));
