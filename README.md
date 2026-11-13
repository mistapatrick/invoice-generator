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


## v3.0.0 changes

- Adds WhatsApp feedback to +234 905 390 3530 and email feedback to viborg.outsourcing@gmail.com.
- Adds an invoice due-date calendar export (`.ics`) with a one-day reminder.
- Sets the print document title to `Invoice_Gen-DD-MM-YYYY-HH-MM` before opening the browser print dialog. Browser print destinations may override the suggested filename.
- Updates the app icon to a quill-and-paper mark with a small ink bottle.
- Explains that file permissions are controlled by the browser and operating system; a website cannot override them.
- Advances the service-worker cache version and precaches `core.js` to reduce stale-shell and missing-module issues during upgrades.

Deploy this release to a Vercel Preview first. Complete the manual checks in `TEST-RESULTS.md` before promoting it to Production.


## Version 3.0.0 international release candidate

- Interface language preferences: English, French, Spanish, Portuguese and Arabic (right-to-left layout for Arabic).
- Currency preferences: NGN, XOF, GHS, USD, CAD, GBP, EUR, MXN, BRL, AED, AUD and INR.
- Currency and language are snapshotted onto newly issued documents. Existing documents without a currency field are interpreted as NGN for backward compatibility.
- Six document layouts: Corporate, Modern minimal, Executive, Creative, Ledger and Editorial. Layout selection changes document structure; all six use the same navy/blue brand palette in this release.
- CFA selection is West African CFA franc (XOF). Central African CFA franc (XAF) is not included in this requested list.

The language packs cover the main navigation, key document-entry labels, preferences, common dashboard labels and core invoice/receipt print labels. Some secondary helper text, validation notices, sharing messages and browser-generated controls may remain in English. A professional translation review and full linguistic QA are required before commercial distribution.


## Compatibility and data handling

- The existing `invoice-gen-data-v2` local-storage key is retained. The application does not clear or migrate the user's existing data on startup.
- Existing records that predate the currency field continue to display as NGN. New records snapshot the selected currency and language so later preference changes do not rewrite issued documents.
- This version does not perform foreign-exchange conversion. It changes the denomination and formatting used for the document; users enter amounts in the selected currency.
- Arabic applies right-to-left page direction and Arabic invoice labels. User-entered names, addresses and line descriptions are not machine-translated.


## Business Labs attribution footer

- Every application view includes the footer text “Powered by Business Labs Software and Technology”.
- The WhatsApp icon opens `https://wa.me/2349053903530` in a new tab or the installed WhatsApp handler.
- The email icon uses `mailto:businesslabs.tech@gmail.com`, allowing the device's configured email application to open with the recipient prefilled.
- The footer is hidden in print styles, so it does not appear on customer invoices, pro forma invoices or receipts.
- The service-worker cache revision is advanced to `v3.0.0-r2` so existing installations request the revised app shell and stylesheet.

## First-run international setup (v3.0.0 onboarding revision)

New installations now open directly to a guided workspace setup screen. The user must first save an application language and default currency, then complete the business or personal sender profile. Document creation is gated until both steps are saved. After preferences are saved, the page scrolls to the sender profile and focuses the display-name field. Once the profile is saved, the app confirms that the workspace is ready and returns the user to the overview.

For backwards compatibility, an installation that already has a saved business name is treated as an existing user and is not forced through the new onboarding flow. The existing `invoice-gen-data-v2` local-storage key and document records are preserved. Clearing local data returns the app to first-run setup. The service-worker cache revision is `invoice-gen-static-v3.0.0-r3`.
