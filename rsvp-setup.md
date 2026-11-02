# Collecting the RSVPs

The "I am in!" form sends each reply to a Google Sheet in the background. One-time setup, about five minutes:

1. Create a new Google Sheet. Name it "Wedding RSVPs".
2. In the sheet, open **Extensions > Apps Script**, delete what is there and paste the code below. Save.
3. Click **Deploy > New deployment**, choose type **Web app**. Set *Execute as*: **Me** and *Who has access*: **Anyone**. Deploy and allow access when asked.
4. Copy the **Web app URL** (it ends in `/exec`).
5. Open `rsvp.js` and paste that URL between the quotes of `RSVP_ENDPOINT`. Re-deploy the site.

Each reply becomes a row: time, name, whether they are coming as a Family or a Couple, and the name on the personalised link (the `?to=` value).

```js
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getLastRow() === 0) sheet.appendRow(['Received', 'Name', 'Party', 'Invited as', 'Sent from device at']);
  var d = JSON.parse(e.postData.contents);
  sheet.appendRow([new Date(), String(d.name).slice(0, 80), d.party === 'Couple' ? 'Couple' : 'Family', String(d.invitedAs || '').slice(0, 60), d.at]);
  return ContentService.createTextOutput('ok');
}
```

To count them, use `=COUNTIF(C:C,"Family")` and `=COUNTIF(C:C,"Couple")` in any empty cells.
