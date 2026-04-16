const ExcelJS = require('exceljs');
const fs = require('fs');

async function testManual() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Test');
  worksheet.columns = [{ header: 'Name', key: 'name' }];
  worksheet.addRow({ name: 'Hello World' });
  
  const path = 'scratch/test_excel_gen.xlsx';
  await workbook.xlsx.writeFile(path);
  console.log('File written to:', path);
  const stats = fs.statSync(path);
  console.log('Size:', stats.size);
}

testManual();
