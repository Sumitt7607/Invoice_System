import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';

export const generateInvoicePDF = async (invoice, settings = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const clientInfo = invoice.clientDetailsSnapshot || invoice.client || {};

      // Date formatter helper
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
          return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
          });
        } catch (e) {
          return dateStr;
        }
      };

      // 1. Teal Header Band (stretching edge-to-edge flush at the very top of the page)
      doc.rect(0, 0, 595.28, 110).fill('#1b5e75');

      // Draw white rounded background box for the logo
      const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
      doc.fillColor('#ffffff').roundedRect(50, 22, 110, 66, 12).fill();
      doc.image(logoPath, 55, 27, { fit: [100, 56], align: 'center', valign: 'center' });

      // Header Text: INVOICE (left-aligned, white, bold)
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(32).text('INVOICE', 180, 42);

      // Company details (right-aligned, white)
      const companyName = settings.name || 'Your Company Name';
      const companyStreet = settings.address?.street || 'Street Address';
      const companyCity = settings.address?.city || '';
      const companyState = settings.address?.state || '';
      const companyZip = settings.address?.zipCode || '';
      const companyCityStateZip = [companyCity, companyState, companyZip].filter(Boolean).join(', ') || 'City, State, Zip/Postal Code';
      const companyPhone = settings.phone || 'Phone';
      const companyEmail = settings.email || 'Email';

      // Flow right-aligned text dynamically using doc.y to prevent wrapping overlaps
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(companyName, 350, 20, { align: 'right', width: 195 });
      doc.font('Helvetica').fontSize(8.5);
      doc.text(companyStreet, 350, doc.y + 2, { align: 'right', width: 195 });
      doc.text(companyCityStateZip, 350, doc.y + 2, { align: 'right', width: 195 });
      doc.text(companyPhone, 350, doc.y + 2, { align: 'right', width: 195 });
      doc.text(companyEmail, 350, doc.y + 2, { align: 'right', width: 195 });

      // 2. Metadata (left) & Bill To details (right)
      const billingStartY = 135;
      
      // Metadata (left)
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9).text('Invoice No.', 50, billingStartY);
      doc.font('Helvetica').text(invoice.invoiceNumber || 'Draft', 125, billingStartY);

      doc.font('Helvetica-Bold').text('Date of Issue', 50, billingStartY + 17);
      doc.font('Helvetica').text(formatDate(invoice.invoiceDate) || 'Enter Date Here', 125, billingStartY + 17);

      doc.font('Helvetica-Bold').text('Due Date', 50, billingStartY + 34);
      doc.font('Helvetica').text(formatDate(invoice.dueDate) || 'Enter Due Date Here', 125, billingStartY + 34);

      // Bill To details (right)
      const clientCompany = clientInfo.company || clientInfo.name || 'Client Company Name';
      const clientStreet = clientInfo.address?.street || 'Address';
      const clientPhone = clientInfo.phone || 'Phone';
      const clientEmail = clientInfo.email || 'Email';

      // Flow Bill To details dynamically using doc.y to prevent overlaps
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('Bill To', 350, billingStartY, { align: 'right', width: 195 });
      doc.font('Helvetica-Bold').fontSize(10).text(clientCompany, 350, doc.y + 2, { align: 'right', width: 195 });
      doc.font('Helvetica').fontSize(8.5);
      doc.text(clientStreet, 350, doc.y + 2, { align: 'right', width: 195 });
      doc.text(clientPhone, 350, doc.y + 2, { align: 'right', width: 195 });
      doc.text(clientEmail, 350, doc.y + 2, { align: 'right', width: 195 });

      // Thick horizontal line to separate top details from the items table
      const separatorY = doc.y > billingStartY + 60 ? doc.y + 12 : billingStartY + 60;
      doc.strokeColor('#000000').lineWidth(2).moveTo(50, separatorY).lineTo(545, separatorY).stroke();

      // 3. Items Table
      const tableHeaderY = separatorY + 10;
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9.5);
      doc.text('Item', 50, tableHeaderY);
      doc.text('Description', 90, tableHeaderY);
      doc.text('No. of Slides', 310, tableHeaderY, { align: 'center', width: 70 });
      doc.text('Rate', 380, tableHeaderY, { align: 'right', width: 70 });
      doc.text('Amount', 450, tableHeaderY, { align: 'right', width: 95 });

      // Thin line under table headers
      doc.strokeColor('#000000').lineWidth(1).moveTo(50, tableHeaderY + 17).lineTo(545, tableHeaderY + 17).stroke();

      // Table Rows
      let currentY = tableHeaderY + 23;
      const rowHeight = 24;
      const itemsList = invoice.items || [];
      const totalRowsCount = Math.max(7, itemsList.length);

      for (let i = 0; i < totalRowsCount; i++) {
        // Page overflow check
        if (currentY + rowHeight > 750) {
          doc.addPage();
          currentY = 50;
        }

        const item = itemsList[i];
        if (item) {
          doc.fillColor('#000000').font('Helvetica').fontSize(9);
          doc.text((i + 1).toString(), 50, currentY + 6);
          doc.text(item.itemName || '', 90, currentY + 6, { width: 215 });
          doc.text(item.quantity.toString(), 310, currentY + 6, { align: 'center', width: 70 });
          doc.text(`${invoice.currency} ${item.rate.toFixed(2)}`, 380, currentY + 6, { align: 'right', width: 70 });
          doc.text(`${invoice.currency} ${item.amount.toFixed(2)}`, 450, currentY + 6, { align: 'right', width: 95 });
        } else {
          // Shaded placeholder rows
          if (i % 2 === 0) {
            doc.fillColor('#f9fafb').rect(50, currentY, 495, rowHeight).fill();
          }
        }

        // Draw thin horizontal separator line
        doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(50, currentY + rowHeight).lineTo(545, currentY + rowHeight).stroke();
        currentY += rowHeight;
      }

      // Thick horizontal line under items grid
      doc.strokeColor('#000000').lineWidth(2).moveTo(50, currentY).lineTo(545, currentY).stroke();
      currentY += 20;

      // 4. Calculations and Terms Notes
      // Check page overflow before drawing summary
      if (currentY + 130 > 780) {
        doc.addPage();
        currentY = 50;
      }

      // Left Column: Terms
      const termsNotes = invoice.notes || settings.termsAndConditions || 'Thank you for your business!';
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text('Terms', 50, currentY);
      doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563').text(termsNotes, 50, currentY + 15, { width: 220, lineGap: 2 });

      // Right Column: Totals
      const taxRateVal = invoice.subtotal > 0 ? (invoice.taxAmount / invoice.subtotal) * 100 : 0;
      let calcY = currentY;

      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9);
      doc.text('Subtotal', 350, calcY);
      doc.font('Helvetica').text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, 440, calcY, { align: 'right', width: 105 });
      calcY += 16;

      doc.font('Helvetica-Bold').text('Discount', 350, calcY);
      doc.font('Helvetica').text(`${invoice.currency} ${invoice.discountAmount.toFixed(2)}`, 440, calcY, { align: 'right', width: 105 });
      calcY += 16;

      doc.font('Helvetica-Bold').text('Tax Rate', 350, calcY);
      doc.font('Helvetica').text(`${taxRateVal.toFixed(2)}%`, 440, calcY, { align: 'right', width: 105 });
      calcY += 16;

      doc.font('Helvetica-Bold').text('Tax', 350, calcY);
      doc.font('Helvetica').text(`${invoice.currency} ${invoice.taxAmount.toFixed(2)}`, 440, calcY, { align: 'right', width: 105 });
      calcY += 16;

      // Purple divider line
      doc.strokeColor('#7b2cbf').lineWidth(1.5).moveTo(350, calcY).lineTo(545, calcY).stroke();
      calcY += 8;

      // Highlighted Total box
      doc.fillColor('#e0f2fe').rect(345, calcY, 200, 22).fill();
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
      doc.text('Total', 355, calcY + 6);
      doc.font('Helvetica-Bold').fontSize(10).text(`${invoice.currency} ${invoice.grandTotal.toFixed(2)}`, 440, calcY + 6, { align: 'right', width: 100 });

      // 5. Solid Teal Footer Band (stretching edge-to-edge at bottom of first page)
      doc.rect(0, 800, 595.28, 42).fill('#1b5e75');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text('THANK YOU FOR YOUR BUSINESS!', 0, 816, { align: 'center', width: 595.28 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
