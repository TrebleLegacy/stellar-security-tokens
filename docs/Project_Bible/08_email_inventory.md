# 08 — Email Inventory

> Every email the platform sends, when, to whom, and via what service
> Generated: 2026-03-10 | **Method names verified against source: 2026-04-30**

---

## Email Provider
**Resend** (HTTP API) — no SMTP. Silently degrades if `RESEND_API_KEY` not set.
From: `Radox <noreply@mail.radox.net>`

---

## Email Catalog

### Investor Emails

| Email | Trigger | Recipient | Service Method | Notes |
|-------|---------|-----------|----------------|-------|
| **Verification Code (link)** | Registration step 1 | Investor email | `EmailService.sendVerificationEmail` | Token link, not 6-digit code |
| **6-Digit OTP Code** | Registration (OTP variant) | Investor email | `EmailService.send6DigitVerificationCode` | Alternative OTP flow |
| **Welcome** | Registration complete | Investor email | `EmailService.sendWelcomeEmail` | Welcome + smart wallet contractId |
| **KYC Approved** | Admin approves KYC | Investor email | `EmailService.sendKYCApprovalEmail` | Approval notification |
| **KYC Rejected** | Admin rejects KYC | Investor email | `EmailService.sendKYCRejectionEmail` | Rejection with reason |
| **Investment Confirmed** | Trade submitted on-chain | Investor email | `EmailService.sendInvestmentConfirmation` | Amount, token, TX hash |
| **Interest Payment Received** | Company makes interest payment | Investor email | `EmailService.sendInterestPaymentConfirmation` | Amount, offer name, TX hash |
| **Bullet Payment Received** | Bullet/lump sum payment | Investor email | `EmailService.sendBulletPaymentConfirmation` | Bullet offer settlement |
| **Quarterly Payment Received** | Quarterly coupon payment | Investor email | `EmailService.sendQuarterlyPaymentConfirmation` | Quarterly distribution |
| **Semi-Annual Payment Received** | Semi-annual coupon | Investor email | `EmailService.sendSemiAnnualPaymentConfirmation` | Semi-annual distribution |

> ⚠️ **No deposit confirmation email exists** — deposit relay completion does NOT send email. `sendDepositConfirmation` is a ghost method that does not exist in EmailService.

### Company Emails

| Email | Trigger | Recipient | Service Method | Notes |
|-------|---------|-----------|----------------|-------|
| **Company Status Update** | Admin approves or rejects company | Company email | `EmailService.sendCompanyStatusUpdate` | Single method — handles both approved/rejected via `status` param |
| **Offer Status Update** | Admin approves/rejects offer | Company email | `EmailService.sendOfferStatusUpdate` | Single method — handles both via `status` param |

> ⚠️ **No payment reminder or overdue notice emails** — `sendPaymentReminder`, `sendOverdueNotice`, `sendNewCompanyNotification`, `sendNewOfferNotification` are **ghost methods** that do NOT exist in EmailService. Payment reminder and overdue logic (`checkOverduePayments`) creates DB records only; no email is sent.

### Admin Emails

| Email | Trigger | Recipient | Service Method | Notes |
|-------|---------|-----------|----------------|-------|
| **Wallet Low Balance** ⭐ | WalletMonitorService (5min poll, on threshold cross) | `ADMIN_ALERT_EMAIL` env var | `EmailService.sendAdminAlert` | Level (warning/critical), XLM balance, link to /admin/wallets |

---

## Payment Reminder Schedule

Configured via `SystemConfig` in DB:
- Default reminder days: `[30, 14, 7, 3, 1]` days before due date
- Overdue check: daily at 00:30 UTC
- Penalty creation: automatic on overdue detection (`companyPenalty` record)
- **No email is sent** — overdue detection updates DB only

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
