const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function testExport() {
  const fileName = `test_export_${Date.now()}.xlsx`;
  const filePath = path.join(__dirname, '..', 'exports', fileName);

  console.log('Target Path:', filePath);

  if (!fs.existsSync(path.dirname(filePath))) {
    console.log('Creating exports directory...');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Test');
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Name', key: 'name', width: 30 }
  ];
  worksheet.addRow({ id: 1, name: 'Test User' });

  try {
    await workbook.xlsx.writeFile(filePath);
    console.log('File written successfully');
    
    if (fs.existsSync(filePath)) {
      console.log('File verified on disk');
      // fs.unlinkSync(filePath); // clean up
    } else {
      console.error('File NOT found after write');
    }
  } catch (err) {
    console.error('Write error:', err.message);
  }
}

testExport();
