# Off-Ramp Operational Runbook

> Operator playbook for the EtherFuse fiat off-ramp (TESOURO / USDC → BRL via PIX)
> Status: v1 — implemented but **disabled by default** pending Phase 0 sandbox probe
> Owner: Pedro · Last updated: 2026-05-15

---

## What this flow does

An investor converts TESOURO or USDC held in their Soroban smart wallet into BRL
paid out via PIX to a registered bank account. The mechanism:

1. Frontend creates a quote (`POST /api/ramp/offramp/quotes`)
2. Frontend creates an order with `useAnchor: true` (`POST /api/ramp/offramp/orders`).
   EtherFuse returns a destination G-address + memo hash.
3. Backend builds a SAC `transfer()` XDR from the investor's C-address to the
   anchor G-address, with `Memo.hash` set. The investor signs with passkey.
4. Backend submits to Soroban RPC. The on-chain transfer credits the anchor's
   classic balance.
5. EtherFuse's anchor monitor detects the credit, marks the order `funded`,
   and initiates the PIX payout.
6. PIX clears → order moves to `completed`, then `finalized` after the
   reversal window.

## ⚠ Phase 0 sandbox probe — REQUIRED before enabling

`ENABLE_OFFRAMP` must stay **false** in every environment until this probe is
green. See `plans/we-have-just-made-fancy-token.md` ("Open Risk #1") for context.

**The unknown**: EtherFuse's anchor monitor watches classic `payment` operations.
Our SAC `transfer()` from a C-address credits the anchor's classic trustline
balance, but surfaces as a Soroban contract event, not a classic payment. The
monitor may not detect it.

**Probe procedure** (sandbox, takes ~1 hour):

1. Provision a test investor with KYC approved + a `pending` or `active`
   PIX bank account (use the existing on-ramp flow first; same RampCustomer).
2. Fund the investor's C-address with sandbox TESOURO via a normal on-ramp.
3. Flip `ENABLE_OFFRAMP=true` on the backend.
4. From the frontend (or via curl), create an off-ramp quote + order for a
   small amount (e.g. 1 TESOURO → ~R$ 0.20). Note the `withdrawAnchorAccount`
   and `withdrawMemo`.
5. Call `prepare-tx`, sign with passkey, call `submit-tx`. Confirm the on-chain
   TX hash via Stellar Expert — the SAC transfer should land at the anchor.
6. **Wait 30-60 seconds** and check `GET /api/ramp/orders/:id`. The webhook
   should have advanced status to `funded`.

**Outcomes**:

- ✅ `funded` → `completed` → `finalized`. Ship as designed. Leave `ENABLE_OFFRAMP=true`.
- ❌ Stuck at `created`. The anchor monitor missed the credit. Add a
  relayer-bridge step (see "Failed probe — adding a relayer bridge" below)
  before re-enabling.
- ❓ Inconsistent results. Ping EtherFuse support with the order IDs and on-chain
  TX hashes. Keep `ENABLE_OFFRAMP=false` until they confirm.

## Failed probe — adding a relayer bridge

If the probe shows the anchor monitor doesn't detect SAC-sourced credits, the
fix is a two-hop transfer:

1. Investor's C-address SAC `transfer()` → platform relayer G-account (the
   existing operations keypair, already in `passkeyWallet.service.js`).
2. Relayer G-account classic `payment` op to the anchor with `Memo.hash`.

This costs one extra Stellar TX (~0.00001 XLM) and adds ~5 seconds of latency.
The relayer pattern matches what other Stellar anchors do for Soroban-sourced
funds.

Implementation lives in a new method on `PasskeyWalletService` — wire it as a
mode switch in `RampOfframpService.prepareSigningTx` keyed on a new env var
(`OFFRAMP_USE_RELAYER_BRIDGE=true`). Don't remove the direct-transfer path;
keep both behind the flag for staged rollout.

## Enabling off-ramp in production

Pre-flight checklist:

- [ ] Phase 0 probe complete and green in sandbox
- [ ] `ENABLE_OFFRAMP=true` set in production env
- [ ] `ETHERFUSE_TESOURO_ASSET_IDENTIFIER` matches mainnet asset (note: this is the
      same env var used by the on-ramp — verify it's mainnet TESOURO, not sandbox)
- [ ] `USDC_CONTRACT_ID` points at mainnet Circle USDC SAC
- [ ] At least one investor onboarded with mainnet-grade KYC for smoke test
- [ ] Webhook delivery verified for off-ramp events (`order_updated` with
      `offramp` orderType) — same endpoint as on-ramp, but new transition paths
- [ ] Frontend deployed with `WithdrawDialog` mounted (verify with `git log`)

After enabling:

- Smoke-test with one ~R$ 1 off-ramp using the operator's own account
- Monitor logs for `PATH_A_SENTINEL`, `RampOfframpError`, and
  `EtherFuseApiError` for 24 hours
- Verify webhook latency p95 stays < 30s

## Incident: order stuck at `created` after signing

**Symptom**: Investor signed the TX, submit succeeded (Stellar Expert shows
the SAC transfer), but the order never advances to `funded`.

**Diagnosis**:

1. Check `RampOrder.burnTransaction` is populated with the TX hash
2. Look up the TX on Stellar Expert — was it successful on-chain? Did the
   memo hash match what EtherFuse expected?
3. Compare on-chain memo bytes against `RampOrder.withdrawMemo` (base64 →
   hex). They MUST match exactly.
4. Check EtherFuse status page for the order (`RampOrder.statusPage`)
5. If on-chain is good and memo matches: EtherFuse anchor monitor missed it.
   This is "Open Risk #1" materializing. Apply the relayer-bridge fix.

**Resolution**:

- If memo mismatch: tokens went into anchor but won't be credited. Contact
  EtherFuse support with the on-chain TX hash and `etherfuseOrderId` to
  manually credit or refund.
- If monitor miss: temporary fix is manual `applyWebhookTransition` via a
  console script. Permanent fix is the relayer bridge.

## Incident: order stuck at `funded`

**Symptom**: SAC transfer confirmed, anchor credited (status=funded), but
PIX never arrives (no transition to `completed`).

**Diagnosis**:

1. Check EtherFuse status page — what does THEIR side say?
2. Check `RampBankAccount.status` for the investor's bank account. If
   `inactive`, EtherFuse may have rejected the payout.
3. Inspect `RampWebhookEvent` rows for the order — any failed processing?

**Resolution**:

- Bank account issue: contact investor, have them re-register the PIX key
- EtherFuse-side issue: support ticket with `etherfuseOrderId`

## Incident: order refunded (tokens came back on-chain)

**Symptom**: Tokens reappear in the investor's wallet after they signed an
off-ramp. The order shows `status=failed` (or `refunded`).

**Cause**: EtherFuse auto-refunds when:
- The memo on the on-chain TX doesn't match a known order
- The amount doesn't match the quoted amount
- The asset is wrong (e.g. sent USDC for a TESOURO quote)

**Resolution**:

- Confirm tokens are back in the investor's balance via Wallet page
- Order timeline should show the failure reason; surface to investor
- If reason is unclear: pull `RampOrder.failureReason` from DB

## Cancellation flow

An investor can cancel an order while `status=created` (before they've
submitted the on-chain TX). After they submit, cancellation is impossible —
the tokens are already at the anchor; the only path is forward (PIX out) or
sideways (EtherFuse refund).

The `/api/ramp/offramp/orders/:id/cancel` endpoint calls EtherFuse's cancel
endpoint and updates the local mirror. If EtherFuse rejects the cancel
(because they've already processed it), the controller surfaces a 502 with
the EtherFuse error message.

## Useful queries

```sql
-- All active off-ramp orders for a given investor
SELECT id, status, source_asset, amount_in_tokens, amount_in_fiat,
       burn_transaction, created_at, updated_at
FROM ramp_order
WHERE investor_id = ? AND order_type = 'offramp'
ORDER BY created_at DESC;

-- Off-ramp orders stuck in non-terminal status > 1 hour
SELECT id, etherfuse_order_id, status, created_at,
       EXTRACT(EPOCH FROM (NOW() - updated_at))/60 AS minutes_since_update
FROM ramp_order
WHERE order_type = 'offramp'
  AND status IN ('created', 'funded')
  AND updated_at < NOW() - INTERVAL '1 hour';

-- Webhook events for a specific order (debugging)
SELECT event_type, resource_status, processed_at, processing_error
FROM ramp_webhook_event
WHERE resource_id = ?  -- etherfuseOrderId
ORDER BY processed_at DESC;
```

## Code map (for the on-call engineer)

| Concern | File |
|---|---|
| Anchor mode XDR build | `backend/src/services/passkeyWallet.service.js#buildWithdrawalTx` (options.memoHashHex branch) |
| Asset code → SAC contract ID | `backend/src/services/passkeyWallet.service.js#resolveAssetSacContractId` |
| Off-ramp orchestration | `backend/src/services/rampOfframp.service.js` |
| Endpoint handlers | `backend/src/controllers/rampController.js` (`createOfframpQuote` … `cancelOfframpOrder`) |
| Route gate | `backend/src/routes/rampRoutes.js` (`if (process.env.ENABLE_OFFRAMP === 'true')`) |
| Webhook state machine | `backend/src/services/rampOrder.service.js#applyWebhookTransition` |
| Frontend dialog | `frontend/src/components/wallet/WithdrawDialog.tsx#PixOfframpPanel` |
| API client | `frontend/src/api/ramp.ts` (`createOfframpQuote` … `cancelOfframpOrder`) |
| Readiness flag exposure | `backend/src/services/rampKyc.service.js#getReadiness` (`offrampEnabled` field) |
