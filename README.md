# Invoice Gen 0.2.0

A dependency-free, mobile-first prototype for creating invoices, pro forma invoices and receipts. It runs as a static web app and stores records in the browser on the device being used.

## Run locally

Requirements: Node.js 18+ (for the build/check commands) and Python 3 (for a local static web server). No third-party npm packages are required.

1. Extract the project folder.
2. Open a terminal in the folder containing `index.html`.
3. Run the checks and production build:

   ```bash
   npm run check
   npm run build
   ```

4. Start a local web server:

   ```bash
   python3 -m http.server 4173
   ```

5. Open `http://localhost:4173/` in a browser. To test the production output instead, run the server from the `dist` directory.

## Deploy to Vercel

Import the GitHub repository. Set the project Root Directory to the folder containing `package.json` and `vercel.json`. Use Framework Preset **Other**. The repository's `vercel.json` sets the build command and output directory:

- Install command: `npm install` (there are no third-party dependencies)
- Build command: `npm run build`
- Output directory: `dist`

The build script checks the application JavaScript syntax and required static files, then copies the app into `dist`. It does not download packages or depend on a bundler.

## Included

- Invoice, pro forma invoice and receipt workflows.
- Four document themes: Corporate, Modern Minimal, Executive and Creative.
- A4 invoice/pro forma print layout and A5 receipt print layout.
- Naira formatting, issue dates, invoice due dates and 30-calendar-day pro forma validity.
- Sender/business profile, bank details, logo image and signature image/name.
- Customer/payer details, line items, quantity, unit price, discount, tax and additional charges.
- Browser-local document history, search, status filtering and void marking.
- JSON backup export and import.
- Installable PWA manifest and basic service-worker caching.
- Responsive desktop and mobile layout.

## PDF output

The document preview uses the browser's native print engine. Select **Print / Save PDF**, then choose **Save as PDF** in the browser's print destination. Invoice and pro forma layouts are A4 portrait; receipts are A5 portrait. This avoids an external PDF library and keeps the prototype self-contained. Verify print output in the target browsers and operating systems before wider distribution.

## Data and security limitations

- Records are stored in browser localStorage. They are not encrypted and are not synced to a server.
- JSON backup files are unencrypted. Store them securely.
- Clearing browser data removes local records. Different devices and browser profiles do not share records.
- Document numbering is generated from records currently present in this browser. Restoring conflicting backups or deleting records outside the app can create numbering conflicts.
- Voiding a record changes its local status only. It does not notify a recipient or reverse a payment.
- A receipt records information entered by the issuer. It does not verify settlement with a bank or payment provider.
- A typed cursive name or uploaded signature image is a visual mark, not a certificate-backed digital signature.
- The browser print dialog creates the PDF. The app does not upload documents. WhatsApp and email actions prepare a message with document details; the user saves the PDF and attaches it manually. The prototype does not silently transmit documents or attach a PDF automatically.
- This is a prototype, not a tax, accounting, payment or legal compliance system.

## Verification status

See `TEST-RESULTS.md` for the checks that were run and the checks that still require a real browser or live Vercel deployment.

## Manual browser acceptance tests

1. Create an invoice with multiple line items. Check subtotal, discount, tax, additional charge and total.
2. Print/save the invoice as A4 PDF and inspect page edges and page breaks.
3. Create a pro forma invoice and confirm validity is 30 calendar days after issue date.
4. Create a receipt and confirm amount and payment method appear.
5. Refresh the page and verify documents remain.
6. Export a backup, import it in a separate test browser profile and verify records.
7. Void a test document and confirm its status changes.
8. Install the PWA over HTTPS, load it once online, then test opening it offline.
