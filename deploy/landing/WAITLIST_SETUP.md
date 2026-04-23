# Waitlist Lead Capture — Google Sheets Setup

## 1. Create the Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**
2. Name it **"Radox Waitlist"**
3. In row 1, add these headers:
   | A | B | C | D | E | F |
   |---|---|---|---|---|---|
   | Timestamp | Name | Email | WhatsApp | Role | Language |

## 2. Create the Apps Script Webhook
1. In the sheet, go to **Extensions → Apps Script**
2. Delete the default code and paste this:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Dedup by email
    const emails = sheet.getRange('C:C').getValues().flat();
    if (emails.includes(data.email)) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: 'duplicate' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.whatsapp || '',
      data.role || '',
      data.lang || 'en'
    ]);
    
    // Optional: Send email notification
    MailApp.sendEmail({
      to: 'pedro@radox.net',
      subject: '🟢 New Radox Waitlist Signup',
      htmlBody: `
        <h3>New Lead</h3>
        <p><b>Name:</b> ${data.name}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>WhatsApp:</b> ${data.whatsapp}</p>
        <p><b>Role:</b> ${data.role}</p>
        <p><b>Language:</b> ${data.lang}</p>
        <p><i>Submitted at ${data.timestamp}</i></p>
      `
    });
    
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'ok' })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Deploy → New deployment**
4. Type: **Web app**
5. Execute as: **Me**
6. Who has access: **Anyone**
7. Click **Deploy** → **Authorize access** → Copy the URL

## 3. Plug the URL into the Landing Page
In `script.js`, replace:
```javascript
const SHEETS_WEBHOOK = 'GOOGLE_APPS_SCRIPT_URL_HERE';
```
With:
```javascript
const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

## 4. Deploy to Production
```bash
scp deploy/landing/script.js deploy/landing/index.html root@134.209.73.154:~/radox/deploy/landing/
```

## What You Get
- **Google Sheet**: Every lead with timestamp, name, email, WhatsApp, role, language
- **Email notification**: Instant email to pedro@radox.net on each signup
- **WhatsApp notification**: Backup notification to your phone
- **Dedup**: Both client-side (localStorage) and server-side (email column check)
- **No backend needed**: The landing page is fully static, zero dependency on the app backend
