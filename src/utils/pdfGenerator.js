import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadInvoicePdf = async (elementId, invoiceNo = 'Invoice') => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('Invoice element not found for PDF export.');
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`${invoiceNo.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('Could not download PDF. Triggering fallback window print...');
    window.print();
  }
};

export const printInvoiceElement = (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  const printWindow = window.open('', '_blank', 'height=800,width=1000');
  if (!printWindow) {
    window.print();
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>ALISTON Invoice Print</title>
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #fff; color: #000; }
          .invoice-card { width: 100%; max-width: 850px; margin: 0 auto; border: 1px solid #ccc; padding: 25px; box-shadow: none; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px 10px; font-size: 13px; text-align: left; }
          th { background-color: #f8fafc; font-weight: 600; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .header-grid { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
          .footer-grid { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; }
          @media print {
            body { padding: 0; }
            .invoice-card { border: none; }
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
