const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Draws the actual content onto a PDF document.
 * This is separated so we can call it twice: once to measure, once to save.
 */
const drawBillContent = (doc, data) => {
  const { order, customer, items, salesperson, shop } = data;

  // --- HEADER ---
  doc.fillColor('#000000');
  doc.fontSize(8).text(shop.name || 'SILVER EAGLE DISTRIBUTORS', { align: 'center', weight: 'bold' });
  doc.fontSize(6).text(shop.address || 'PO BOX 841521, DALLAS, TX 75284', { align: 'center' });
  doc.text(`Phone: ${shop.phone || '713-869-4361'}`, { align: 'center' });
  doc.moveDown(0.3);

  const orderDate = new Date(order.created_at);
  doc.text(orderDate.toLocaleString(), { align: 'center' });
  doc.moveDown(1);

  // Invoice Details
  doc.fontSize(7);
  doc.text(`Account: ${customer.account_id || 'N/A'}`);
  doc.fontSize(8).text(customer.name, { weight: 'bold' });
  doc.fontSize(6).text(customer.address);
  doc.text(customer.phone || '');
  doc.moveDown(0.3);

  if (customer.tobacco_permit_number) {
    doc.text(`TABC Permit #: ${customer.tobacco_permit_number}`);
  }
  doc.moveDown(0.5);

  doc.fontSize(7);
  doc.text(`Invoice#: ${order.order_number}`, { weight: 'bold' });
  doc.text(`Load: ${order.load_number || 'N/A'}`);
  doc.text(`Salesrep: ${salesperson.name || 'N/A'}`);
  doc.moveDown(0.5);

  // --- ITEMS TABLE HEADER ---
  const tableTop = doc.y;
  doc.fontSize(5.5);
  doc.text('ITEM#', 10, tableTop);
  doc.text('QTY', 32, tableTop);
  doc.text('DESCRIPTION', 52, tableTop);
  doc.text('AMOUNT', 160, tableTop, { align: 'right', width: 34 });

  doc.strokeColor('#000000');
  doc.moveTo(10, tableTop + 10).lineTo(194, tableTop + 10).stroke();
  doc.moveDown(1.5);

  // --- ITEMS ---
  items.forEach(item => {
    const startY = doc.y;
    doc.fontSize(5.5);
    doc.text(item.item_number || 'N/A', 10, startY);
    doc.text(item.quantity.toString(), 32, startY);

    // Description can span multiple lines
    doc.text(item.item_name || item.description_name, 52, startY, { width: 108 });

    const lineTotal = parseFloat(item.subtotal).toFixed(2);
    doc.text(lineTotal, 160, startY, { align: 'right', width: 34 });

    doc.moveDown(0.3);
  });

  doc.moveDown(1);
  doc.moveTo(10, doc.y).lineTo(194, doc.y).stroke();
  doc.moveDown(0.5);

  // --- TOTALS ---
  const totalsX = 110;
  doc.fontSize(7);

  let currentY = doc.y;
  doc.text('Total Sales:', totalsX, currentY);
  doc.text(parseFloat(order.total_amount).toFixed(2), 160, currentY, { align: 'right', width: 34 });
  doc.moveDown(0.2);

  currentY = doc.y;
  doc.text('Total Credits:', totalsX, currentY);
  doc.text(parseFloat(order.total_credits || 0).toFixed(2), 160, currentY, { align: 'right', width: 34 });
  doc.moveDown(0.2);

  currentY = doc.y;
  doc.text('Total Deposit:', totalsX, currentY);
  doc.text(parseFloat(order.total_deposit || 0).toFixed(2), 160, currentY, { align: 'right', width: 34 });
  doc.moveDown(0.4);

  currentY = doc.y;
  doc.fontSize(8).text('Invoice Total:', totalsX, currentY, { weight: 'bold' });
  doc.text(parseFloat(order.total_amount).toFixed(2), 160, currentY, { align: 'right', width: 34 });
  doc.moveDown(1);

  // --- FOOTER / LEGAL ---
  doc.fontSize(5.5);
  const legalText = "THIS IS AN OFFER. BY SIGNING THIS OFFER, YOU AGREE THAT YOU WILL REFRAIN FROM SELLING THE PRODUCTS CONVEYED TO YOU BY THIS OFFER TO OTHER RETAILERS FOR RESALE...";
  doc.text(legalText, 10, doc.y, { align: 'justify', width: 184 });
  doc.moveDown(2);

  // --- SIGNATURES ---
  const sigY = doc.y;
  doc.fontSize(7);
  doc.text('Customer Signature:', 10, sigY);
  doc.strokeColor('#000000').moveTo(10, sigY + 30).lineTo(90, sigY + 30).stroke();

  doc.text('Driver Signature:', 110, sigY);
  doc.strokeColor('#000000').moveTo(110, sigY + 30).lineTo(190, sigY + 30).stroke();
  doc.moveDown(1); // Minimal space at the very bottom

  // Return the final Y position
  return doc.y;
};

/**
 * Generates a thermal-style bill PDF with PERFECT auto-height.
 */
const generateBill = async (data) => {
  const { order } = data;

  const billsDir = path.join(__dirname, '..', 'uploads', 'bills');
  if (!fs.existsSync(billsDir)) fs.mkdirSync(billsDir, { recursive: true });

  const fileName = `bill_${order.order_number}.pdf`;
  const filePath = path.join(billsDir, fileName);
  const pageWidth = 204;

  // --- PASS 1: Measure exact content height ---
  // We use a dummy document with a huge height to prevent pagination
  const dummyDoc = new PDFDocument({
    size: [pageWidth, 5000],
    margins: { top: 10, bottom: 10, left: 10, right: 10 }
  });
  const finalY = drawBillContent(dummyDoc, data);
  const perfectHeight = Math.ceil(finalY + 15); // Add a tiny 15px buffer for the cut

  // --- PASS 2: Generate the real PDF with the exact height ---
  const doc = new PDFDocument({
    size: [pageWidth, perfectHeight],
    margins: { top: 10, bottom: 10, left: 10, right: 10 }
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  drawBillContent(doc, data);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(fileName));
    stream.on('error', reject);
  });
};

module.exports = { generateBill };
