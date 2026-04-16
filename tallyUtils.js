// ============================================================
// BE — Tally Integration Utilities
// File: /be-app/server/utils/tallyUtils.js
// ============================================================

/**
 * Build Tally XML for a Voucher (Receipt/Payment)
 * @param {Object} record - Income or Expense record
 * @param {string} vchType - 'Receipt' or 'Payment'
 * @returns {string} XML string
 */
function buildVoucherXML(record, vchType) {
  const date = (record.date || '').replace(/-/g, '');
  const amt = vchType === 'Payment' 
    ? Math.abs(record.total_amount) 
    : record.total_amount;
  
  const voucherNo = vchType === 'Receipt' ? record.invoice_no || '' : record.voucher_no || '';

  return `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${vchType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${date}</DATE>
            <NARRATION>${record.description || ''}</NARRATION>
            <VOUCHERTYPENAME>${vchType}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${voucherNo}</VOUCHERNUMBER>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${record.category || (vchType === 'Receipt' ? 'Sales' : 'Purchase')}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>${vchType === 'Receipt' ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
              <AMOUNT>-${amt}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Cash</LEDGERNAME>
              <ISDEEMEDPOSITIVE>${vchType === 'Receipt' ? 'No' : 'Yes'}</ISDEEMEDPOSITIVE>
              <AMOUNT>${amt}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

module.exports = {
  buildVoucherXML
};
