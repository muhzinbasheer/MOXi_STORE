const PDFDocument = require('pdfkit');
const moment = require('moment');

const generateInvoicePDF = (order, res) => {
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers to indicate a file download
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe the PDF into the response stream
    doc.pipe(res);

    // Add company header
    doc.fontSize(20).text('MOXi STORE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('INVOICE', { align: 'center', underline: true });
    doc.moveDown();

    // Add order details section
    doc.fontSize(12);
    doc.text(`Order ID: ${order.orderId}`, { align: 'left' });
    doc.text(`Order Date: ${moment(order.createdAt).format('MMMM Do YYYY, h:mm:ss a')}`, { align: 'left' });
    doc.text(`Payment Method: ${order.paymentMethod}`, { align: 'left' });
    doc.moveDown();

    // Add items table header
    doc.fontSize(12).text('Items:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text('Item', 50, doc.y, { continued: true });
    doc.text('Quantity', 250, doc.y, { continued: true });
    doc.text('Original Price', 350, doc.y, { continued: true });
    doc.text('Total', 450, doc.y);
    doc.moveDown();

    // Add items
    order.items.forEach(item => {
        doc.text(item.productId.title, 50, doc.y, { continued: true });
        doc.text(item.quantity, 250, doc.y, { continued: true });
        doc.text(`₹${item.price}`, 350, doc.y, { continued: true });
        doc.text(`₹${order.totalPrice}`, 450, doc.y);
    });

    doc.moveDown();

    // Add totals
    doc.fontSize(12).text(`Total Price: ₹${order.totalPrice}`, { align: 'right' });
    doc.text(`Discount: ₹${order.discount}`, { align: 'right' });
    doc.text(`Grand Total: ₹${order.totalPrice - order.discount}`, { align: 'right' });

    // Finalize the PDF
    doc.end();
};

module.exports = {
    generateInvoicePDF
};
