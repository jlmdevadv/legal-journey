import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DocumentData, DocumentFormat } from '../types/document';

// Helper to remove bold markers for plain text
const removeBoldMarkers = (text: string): string => {
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
};

export const generateTxtDocument = (data: DocumentData, filename: string) => {
  const fullContent = [
    data.title,
    '',
    data.parties ? `PARTES PRINCIPAIS\n${removeBoldMarkers(data.parties)}` : '',
    '',
    data.otherInvolved ? `OUTROS ENVOLVIDOS\n${removeBoldMarkers(data.otherInvolved)}` : '',
    '',
    removeBoldMarkers(data.content),
    '',
    data.locationDate ? `${data.locationDate}` : '',
    '',
    data.signatures ? `ASSINATURAS\n${removeBoldMarkers(data.signatures)}` : ''
  ].filter(Boolean).join('\n');

  const blob = new Blob([fullContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Helper to parse bold markers and create TextRuns
const parseTextWithBold = (text: string): TextRun[] => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts
    .filter(part => part.length > 0)
    .map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({ text: part.slice(2, -2), bold: true });
      }
      return new TextRun({ text: part });
    });
};

export const generateDocxDocument = async (data: DocumentData, filename: string) => {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: data.title, bold: true, size: 32 })],
      heading: HeadingLevel.TITLE,
      alignment: 'center'
    })
  );

  children.push(new Paragraph({ text: '' })); // Empty line

  // Parties section
  if (data.parties) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'PARTES PRINCIPAIS', bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_1
      })
    );
    
    data.parties.split('\n').forEach(line => {
      if (line.trim()) {
        children.push(new Paragraph({ children: parseTextWithBold(line) }));
      }
    });
    
    children.push(new Paragraph({ text: '' }));
  }

  // Other involved section
  if (data.otherInvolved) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'OUTROS ENVOLVIDOS', bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_1
      })
    );
    
    data.otherInvolved.split('\n').forEach(line => {
      if (line.trim()) {
        children.push(new Paragraph({ children: parseTextWithBold(line) }));
      }
    });
    
    children.push(new Paragraph({ text: '' }));
  }

  // Main content
  data.content.split('\n').forEach(line => {
    children.push(new Paragraph({ children: parseTextWithBold(line) }));
  });

  children.push(new Paragraph({ text: '' }));

  // Location and Date
  if (data.locationDate) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: data.locationDate })],
        alignment: 'right'
      })
    );
    children.push(new Paragraph({ text: '' }));
  }

  // Signatures section
  if (data.signatures) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'ASSINATURAS', bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_1
      })
    );
    
    data.signatures.split('\n').forEach(line => {
      if (line.trim()) {
        children.push(new Paragraph({ children: parseTextWithBold(line) }));
      }
    });
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children
    }]
  });

  const buffer = await Packer.toBlob(doc);
  const url = URL.createObjectURL(buffer);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generatePdfDocument = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found for PDF generation');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const imgY = 30;

  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
  pdf.save(`${filename}.pdf`);
};

export const downloadDocument = async (
  format: DocumentFormat,
  data: DocumentData,
  filename: string,
  elementId?: string
) => {
  const cleanFilename = filename.replace(/\s+/g, '-').toLowerCase();
  
  switch (format) {
    case 'txt':
      generateTxtDocument(data, cleanFilename);
      break;
    case 'docx':
      await generateDocxDocument(data, cleanFilename);
      break;
    case 'pdf':
      if (!elementId) {
        throw new Error('Element ID required for PDF generation');
      }
      await generatePdfDocument(elementId, cleanFilename);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};
