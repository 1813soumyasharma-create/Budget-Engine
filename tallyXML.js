// ============================================================
// BE — Tally XML Utility
// File: /be-app/server/utils/tallyXML.js
//
// Builds XML vouchers for Tally Prime HTTP import,
// and parses XML daybook export responses.
// ============================================================

const xml2js = require('xml2js');

// ── Build a Receipt voucher XML (for Income records) ────────
function buildReceiptXML(record) {
  const date = (record.date || '').replace(/-/g, '');
  return `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Receipt" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${date}</DATE>
            <NARRATION>${escapeXml(record.description || '')}</NARRATION>
            <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(record.invoice_no || '')}</VOUCHERNUMBER>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(record.category || 'Sales Accounts')}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${Math.abs(record.total_amount)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Cash</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${Math.abs(record.total_amount)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

// ── Build a Payment voucher XML (for Expense records) ───────
function buildPaymentXML(record) {
  const date = (record.date || '').replace(/-/g, '');
  return `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Payment" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${date}</DATE>
            <NARRATION>${escapeXml(record.description || '')}</NARRATION>
            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(record.voucher_no || '')}</VOUCHERNUMBER>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(record.category || 'Purchase Accounts')}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${Math.abs(record.total_amount)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Cash</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${Math.abs(record.total_amount)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

// ── Build Daybook export request XML ────────────────────────
function buildDaybookRequestXML(fromDate, toDate) {
  const from = fromDate ? fromDate.replace(/-/g, '') : '';
  const to = toDate ? toDate.replace(/-/g, '') : '';
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Daybook</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          ${from ? `<SVFROMDATE>${from}</SVFROMDATE>` : ''}
          ${to ? `<SVTODATE>${to}</SVTODATE>` : ''}
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
}

// ── Parse Tally XML daybook response into voucher array ─────
async function parseDaybookXML(xmlText) {
  try {
    const parsed = await xml2js.parseStringPromise(xmlText, {
      explicitArray: false,
      ignoreAttrs: false
    });

    let vouchers = [];

    try {
      const msg = parsed?.ENVELOPE?.BODY?.EXPORTDATA?.REQUESTDATA?.TALLYMESSAGE;
      if (!msg) return [];

      vouchers = msg.VOUCHER || [];
      if (!Array.isArray(vouchers)) vouchers = [vouchers];
    } catch {
      return [];
    }

    return vouchers.map(v => {
      const rawDate = String(v.DATE || '');
      const date = rawDate.length === 8
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
        : rawDate;

      return {
        date,
        narration: v.NARRATION || '',
        voucherNo: v.VOUCHERNUMBER || '',
        voucherType: (v.VOUCHERTYPENAME || '').toLowerCase(),
        amount: parseFloat(v.AMOUNT || 0)
      };
    }).filter(v => v.date); // drop malformed entries

  } catch (err) {
    console.error('[tallyXML] Parse error:', err.message);
    return [];
  }
}

// ── Escape special XML characters ───────────────────────────
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = {
  buildReceiptXML,
  buildPaymentXML,
  buildDaybookRequestXML,
  parseDaybookXML,
  escapeXml
};