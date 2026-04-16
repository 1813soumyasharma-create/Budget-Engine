const ExcelJS = require('exceljs');
const { db } = require('../db');
const path = require('path');
const fs = require('fs');

async function exportIncome(req, res) {
  try {
    const rows = db.prepare('SELECT * FROM income ORDER BY date DESC').all();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Income');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 5 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'GST %', key: 'gst_rate', width: 10 },
      { header: 'GST Amt', key: 'gst_amount', width: 15 },
      { header: 'Total Amount', key: 'total_amount', width: 15 },
      { header: 'Invoice No', key: 'invoice_no', width: 20 },
      { header: 'Tally Synced', key: 'tally_synced', width: 15 }
    ];

    rows.forEach(row => {
      worksheet.addRow({
        ...row,
        tally_synced: row.tally_synced === 1 ? 'Yes' : 'No'
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'income_export.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function exportExpenses(req, res) {
  try {
    const rows = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 5 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Vendor', key: 'vendor', width: 25 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'GST %', key: 'gst_rate', width: 10 },
      { header: 'GST Amt', key: 'gst_amount', width: 15 },
      { header: 'Total Amount', key: 'total_amount', width: 15 },
      { header: 'Voucher No', key: 'voucher_no', width: 20 },
      { header: 'Tally Synced', key: 'tally_synced', width: 15 }
    ];

    rows.forEach(row => {
      worksheet.addRow({
        ...row,
        tally_synced: row.tally_synced === 1 ? 'Yes' : 'No'
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'expenses_export.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function generateSyncReport() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `tally_sync_${timestamp}.xlsx`;
  const exportPath = path.join(__dirname, '../../public/exports', filename);
  
  if (!fs.existsSync(path.dirname(exportPath))) {
    fs.mkdirSync(path.dirname(exportPath), { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  const summarySheet = workbook.addWorksheet('Sync Summary');
  
  // Combine all data for a quick audit
  const income = db.prepare('SELECT * FROM income ORDER BY date DESC').all();
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();

  summarySheet.columns = [
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Description', key: 'description', width: 30 }
  ];

  income.forEach(row => summarySheet.addRow({ type: 'Income', ...row }));
  expenses.forEach(row => summarySheet.addRow({ type: 'Expense', ...row }));

  await workbook.xlsx.writeFile(exportPath);
  return `/exports/${filename}`;
}

async function generateExcel({ title, columns, data, filePath }) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);

  worksheet.columns = columns;

  data.forEach(row => {
    const formattedRow = { ...row };
    if ('tally_synced' in formattedRow) {
      formattedRow.tally_synced = formattedRow.tally_synced === 1 ? 'Yes' : 'No';
    }
    worksheet.addRow(formattedRow);
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  await workbook.xlsx.writeFile(filePath);
}

async function generateMultiSheetExcel({ sheets, filePath }) {
  const workbook = new ExcelJS.Workbook();

  sheets.forEach(s => {
    const worksheet = workbook.addWorksheet(s.name);
    worksheet.columns = s.columns;
    s.data.forEach(row => {
      const formattedRow = { ...row };
      if ('tally_synced' in formattedRow) {
        formattedRow.tally_synced = formattedRow.tally_synced === 1 ? 'Yes' : 'No';
      }
      worksheet.addRow(formattedRow);
    });
    worksheet.getRow(1).font = { bold: true };
  });

  await workbook.xlsx.writeFile(filePath);
}

module.exports = {
  exportIncome,
  exportExpenses,
  generateSyncReport,
  generateExcel,
  generateMultiSheetExcel
};
