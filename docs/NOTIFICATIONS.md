# Notifications & Emails

The platform uses **SMTP** to send transactional emails to users.

## Configuration

Email settings are defined in the `.env` file (or System Config in future).

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=app_specific_password
SMTP_FROM=noreply@tokenizadora.com
```

## Email Triggers

Emails are sent automatically during the following events:

1.  **Welcome Email**: Upon successful registration.
2.  **Email Verification**: Contains a verification link/code.
3.  **Investment Confirmation**: Sent after a successful purchase.
4.  **Dividend Received**: Sent when the platform processes monthly interest payments.

## Troubleshooting

- **No Emails Received**:
    - Check `SMTP_USER` and `SMTP_PASSWORD` in `.env`.
    - Allow "Less Secure Apps" or use App Passwords (if using Gmail).
    - Check Spam folder.
- **Provider Limits**: Gmail has sending limits (approx 500/day). For production, use SendGrid or Amazon SES.

## Future Improvements

- **In-App Notifications**: Database capabilities exist but UI needs integration.
- **Templates**: Currently using basic HTML strings. Move to template engine (e.g., EJS/Handlebars) in `backend/src/templates`.
