import JsBarcode from 'jsbarcode';

export const generateBarcodeSvg = (elementId, value, options = {}) => {
  try {
    const defaultOptions = {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 14,
      font: 'monospace',
      lineColor: '#000000',
      background: '#ffffff',
      margin: 10,
      ...options
    };
    
    JsBarcode(`#${elementId}`, value || 'ALISTON001', defaultOptions);
  } catch (error) {
    console.error('Barcode generation error:', error);
  }
};
