# API Key Rotation Policy

## Scope

The `TRUSTED_API_KEY` env var grants **unlimited rate-limit bypass** via the `X-API-KEY` header.
It is checked in [`rateLimit.js`](file:///Users/pedrosaragossy/Workspace/Tokenizadora/stellar-security-tokens/backend/src/middleware/rateLimit.js#L154-L157).

## Rules

1. **Rotation frequency:** Every **90 days**, or immediately after any suspected leak.
2. **Key format:** Minimum 64-char random string. Generate with:
   ```bash
   openssl rand -base64 48
   ```
3. **Deployment:** Update in `.env` (never commit). Restart the backend container.
4. **Access:** Only the backend `.env` should contain this key. Never share via chat/email — use a secrets manager or direct server access.
5. **Monitoring:** Log all requests using `X-API-KEY` (already logged by Morgan). Review weekly for anomalous patterns.
6. **Revocation:** To disable, remove `TRUSTED_API_KEY` from `.env`. The `skipRateLimitForTrusted` function will return `false` for all requests.

## Future Improvement

Consider IP-allowlisting for trusted API key usage (e.g., only allow from internal infra IPs).
