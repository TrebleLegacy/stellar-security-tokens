import { getIssuerKeypair, getNetworkPassphrase } from '../config/stellar.js';
import { Token } from '../models/Token.js';
import prisma from '../config/prisma.js';

export class TomlService {
    /**
     * Generates the stellar.toml content dynamically
     * @returns {Promise<string>} TOML formatted string
     */
    static async generateToml() {
        const issuerKey = getIssuerKeypair().publicKey();
        const networkPassphrase = getNetworkPassphrase();

        // Fetch all tokens from DB
        const tokens = await Token.findAll(1000, 0);

        // Fetch system settings for organizational info
        const configs = await prisma.systemConfig.findMany();
        const configMap = configs.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {});

        let toml = `# Stellar TOML File
# Generated dynamically for compliance

VERSION="2.0.0"
NETWORK_PASSPHRASE="${networkPassphrase}"

[DOCUMENTATION]
ORG_NAME="${configMap.org_name || 'Stellar Security Tokens Platform'}"
ORG_URL="${process.env.FRONTEND_URL || 'http://localhost:5173'}"
ORG_DESCRIPTION="${configMap.org_description || 'Security Token Issuance Platform'}"

ACCOUNTS=[
  "${issuerKey}"
]

`;

        // Add currencies section
        for (const token of tokens) {
            toml += `[[CURRENCIES]]
code="${token.assetCode}"
issuer="${token.issuerPublicKey}"
display_decimals=7
name="${token.assetCode} Security Token"
desc="${token.description || 'Stellar Security Token'}"
conditions="Restricted to authorized investors only."
is_asset_withheld=false
is_stackable=false
`;

            // If we have an offer related, we could add more info
            if (token.offerId) {
                toml += `status="live"\n`;
            }

            toml += '\n';
        }

        return toml;
    }
}
