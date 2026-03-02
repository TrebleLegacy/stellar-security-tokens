# Notifications & Emails

The platform uses **SMTP** to send transactional emails to users via `EmailService` (`backend/src/services/email.service.js`).

## Configuration

Email settings are defined in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=psaragossy@gmail.com
SMTP_PASSWORD=<app_specific_password>
SMTP_FROM=psaragossy@gmail.com
```

> Production should use Amazon SES, SendGrid, or Postmark with a verified sender domain (e.g., `info@radox.net`).

## Email Triggers

Emails are sent automatically during the following events:

1.  **Email Verification**: Contains a verification link with token (`sendVerificationEmail`).
2.  **Welcome Email**: Upon successful email verification + smart wallet deployment (`sendWelcomeEmail`).
3.  **Investment Confirmation**: Sent after a successful token purchase.
4.  **Dividend Received**: Sent when monthly interest payments are processed.
5.  **Payment Reminders**: Sent to companies before payment due dates (30, 21, 14, 7, 3, 1 day, due day).
6.  **Admin MFA OTP**: 6-digit verification code sent during admin login.

## Template System

Email templates are **inline HTML** within `email.service.js` methods (no external template files). Each email method contains its own HTML template with Radox branding.

## In-App Notifications

The `Notification` Prisma model supports in-app notifications (stored in `notifications` table). Currently created by services but UI integration is pending.

## Troubleshooting

- **No Emails Received**:
    - Check `SMTP_USER` and `SMTP_PASSWORD` in `.env`.
    - Use App Passwords for Gmail (not account password).
    - Check Spam folder.
- **Provider Limits**: Gmail has sending limits (~500/day). For production, use SendGrid or Amazon SES.
