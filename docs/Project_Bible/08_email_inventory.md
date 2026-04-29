# 08 — Email Inventory

> Every email the platform sends, when, to whom, and via what service
> Generated: 2026-03-10

---

## Email Provider
**Resend** (HTTP API) — no SMTP. Silently degrades if `RESEND_API_KEY` not set.
From: `Radox <noreply@mail.radox.net>`

---

## Email Catalog

### Investor Emails

| Email | Trigger | Recipient | Service | Template |
|-------|---------|-----------|---------|----------|
| **Verification Code** | Registration step 1 | Investor email | `EmailService.sendVerificationCode` | 6-digit code, 30-min expiry |
| **Welcome** | Registration complete | Investor email | `EmailService.sendWelcome` | Welcome + next steps |
| **KYC Approved** | Admin approves KYC | Investor email | `EmailService.sendKycApproval` | Approval notification |
| **KYC Rejected** | Admin rejects KYC | Investor email | `EmailService.sendKycRejection` | Rejection with reason |
| **Investment Confirmed** | Trade submitted on-chain | Investor email | `EmailService.sendInvestmentConfirmation` | Amount, token, TX hash |
| **Payment Received** | Company makes interest payment | Investor email | `EmailService.sendPaymentNotification` | Amount received, offer name |
| **Deposit Completed** | USDC relay to smart wallet | Investor email | `EmailService.sendDepositConfirmation` | Amount, wallet address |

### Company Emails

| Email | Trigger | Recipient | Service | Template |
|-------|---------|-----------|---------|----------|
| **Company Verification Code** | Registration step 1 | Company email | `EmailService.sendVerificationCode` | Same as investor |
| **Company Approved** | Admin approves company | Company email | `EmailService.sendCompanyApproved` | Can now create offers |
| **Company Rejected** | Admin rejects company | Company email | `EmailService.sendCompanyRejected` | Rejection with reason |
| **Offer Reviewed** | Admin approves/rejects offer | Company email | `EmailService.sendOfferReview` | Status + feedback |
| **Payment Reminder** | Cron (configurable days before due) | Company email | `PaymentReminderService` → `EmailService.sendPaymentReminder` | Upcoming due date, amount |
| **Overdue Notice** | Cron (daily) | Company email | `CompanyPaymentService.checkOverdue` → `EmailService.sendOverdueNotice` | Past due amount, penalty |

### Admin Emails

| Email | Trigger | Recipient | Service | Template |
|-------|---------|-----------|---------|----------|
| **New Company Pending** | Company registation complete | All platform admins | `EmailService.sendNewCompanyNotification` | Company name, review link |
| **New Offer Pending** | Offer submitted for review | All platform admins | `EmailService.sendNewOfferNotification` | Offer details, review link |
| **Wallet Low Balance** ⭐ | WalletMonitorService (5min poll, on threshold cross) | `ADMIN_ALERT_EMAIL` env var | `EmailService.sendAdminAlert` | Level (warning/critical), XLM balance, link to /admin/wallets |
| **Settlement Deposit Received** ⭐ | Company submits deposit for MaturitySettlement | All platform admins | `EmailService.sendAdminAlert` (or direct notify) | Offer ID, deposit amount — triggers admin to call settle_batch |

---

## Payment Reminder Schedule

Configured via `SystemConfig` in DB:
- Default reminder days: `[30, 14, 7, 3, 1]` days before due date
- Overdue check: daily at 00:30 UTC
- Penalty creation: automatic on overdue detection

---

## Email Dependencies

```
EmailService
  ├── RESEND_API_KEY (required for sending)
  ├── EMAIL_FROM (sender address)
  ├── FRONTEND_URL (for links in emails)
  └── Templates (inline HTML in EmailService methods)
```

> ⚠️ **No template engine** — all email HTML is constructed inline via string concatenation in `EmailService`. This makes emails hard to maintain and style.

> ⚠️ **No email queue** — emails are sent synchronously in the request cycle. A failed email send does NOT roll back the operation (graceful degradation), but adds latency.
