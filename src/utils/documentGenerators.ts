import { Document, Paragraph, TextRun, Packer, AlignmentType } from 'docx';
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

// Helper to detect if a line is a clause
const isClause = (text: string): boolean => {
  return /^Cláusula\s+\d+[ªº]?\./.test(text.trim());
};

// Helper to parse bold markers and create TextRuns
const parseTextWithBold = (text: string, forceClauseBold: boolean = false): TextRun[] => {
  // If it's a clause, apply bold to the clause title
  if (forceClauseBold || isClause(text)) {
    const clauseMatch = text.match(/^(Cláusula\s+\d+[ªº]?\.)(.*)/);
    if (clauseMatch) {
      return [
        new TextRun({ 
          text: clauseMatch[1], 
          bold: true,
          font: "Times New Roman",
          size: 24 // 12pt
        }),
        new TextRun({ 
          text: clauseMatch[2],
          font: "Times New Roman",
          size: 24
        })
      ];
    }
  }
  
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts
    .filter(part => part.length > 0)
    .map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({ 
          text: part.slice(2, -2), 
          bold: true,
          font: "Times New Roman",
          size: 24
        });
      }
      return new TextRun({ 
        text: part,
        font: "Times New Roman",
        size: 24
      });
    });
};

export const generateDocxDocument = async (data: DocumentData, filename: string) => {
  const children: Paragraph[] = [];

  // Title - 14pt, bold, uppercase, centered
  children.push(
    new Paragraph({
      children: [
        new TextRun({ 
          text: data.title.toUpperCase(), 
          bold: true, 
          size: 28, // 14pt
          font: "Times New Roman"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 240 // Extra space after title
      }
    })
  );

  children.push(new Paragraph({ text: '' })); // Empty line

  // Parties section
  if (data.parties) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: 'PARTES PRINCIPAIS', 
            bold: true,
            font: "Times New Roman",
            size: 24
          })
        ],
        alignment: AlignmentType.LEFT,
        spacing: {
          before: 240,
          after: 120,
          line: 360 // 1.5 line spacing
        }
      })
    );
    
    data.parties.split('\n').forEach(line => {
      if (line.trim()) {
        children.push(
          new Paragraph({ 
            children: parseTextWithBold(line),
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              line: 360,
              after: 120
            }
          })
        );
      }
    });
    
    children.push(new Paragraph({ text: '' }));
  }

  // Other involved section
  if (data.otherInvolved) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: 'OUTROS ENVOLVIDOS', 
            bold: true,
            font: "Times New Roman",
            size: 24
          })
        ],
        alignment: AlignmentType.LEFT,
        spacing: {
          before: 240,
          after: 120,
          line: 360
        }
      })
    );
    
    data.otherInvolved.split('\n').forEach(line => {
      if (line.trim()) {
        children.push(
          new Paragraph({ 
            children: parseTextWithBold(line),
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              line: 360,
              after: 120
            }
          })
        );
      }
    });
    
    children.push(new Paragraph({ text: '' }));
  }

  // Main content (clauses with justified alignment and extra spacing)
  data.content.split('\n').forEach(line => {
    if (line.trim()) {
      const isClauseLine = isClause(line);
      children.push(
        new Paragraph({ 
          children: parseTextWithBold(line, isClauseLine),
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            line: 360, // 1.5 line spacing
            after: isClauseLine ? 180 : 120, // Extra space after clauses
            before: isClauseLine ? 180 : 0 // Extra space before clauses
          }
        })
      );
    }
  });

  children.push(new Paragraph({ text: '' }));

  // Location and Date - aligned right
  if (data.locationDate) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: data.locationDate,
            font: "Times New Roman",
            size: 24
          })
        ],
        alignment: AlignmentType.RIGHT,
        spacing: {
          before: 240,
          after: 240,
          line: 360
        }
      })
    );
  }

  // Signatures section - centered
  if (data.signatures) {
    children.push(new Paragraph({ text: '' })); // Extra space
    children.push(new Paragraph({ text: '' })); // More space
    
    children.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: 'ASSINATURAS', 
            bold: true,
            font: "Times New Roman",
            size: 24
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 240,
          line: 360
        }
      })
    );
    
    // Process signature blocks (separated by double line breaks)
    const signatureBlocks = data.signatures.split('\n\n');
    
    signatureBlocks.forEach(block => {
      const lines = block.split('\n').filter(l => l.trim());
      
      // Signature line
      children.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: '_'.repeat(50),
              font: "Times New Roman",
              size: 24
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { line: 360 }
        })
      );
      
      // Name, CPF, Role - all centered
      lines.forEach(line => {
        children.push(
          new Paragraph({
            children: parseTextWithBold(line),
            alignment: AlignmentType.CENTER,
            spacing: { line: 360 }
          })
        );
      });
      
      children.push(new Paragraph({ text: '' })); // Space between signatures
    });
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1701, // 2.5cm (1cm = 567 twips)
            right: 1701,
            bottom: 1701,
            left: 1701,
          },
        },
      },
      children
    }],
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 24 // 12pt (size is in half-points, so 24 = 12pt)
          },
          paragraph: {
            spacing: {
              line: 360, // 1.5 lines
              after: 120
            }
          }
        }
      }
    }
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

// Helper to format HTML content with bold markers and clause detection
const formatHtmlContent = (content: string, alignment: string, detectClauses: boolean = false): string => {
  return content.split('\n')
    .filter(line => line.trim())
    .map(line => {
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Detect clauses and make title bold
      if (detectClauses && /^Cláusula\s+\d+[ªº]?\./.test(line)) {
        formattedLine = formattedLine.replace(
          /^(Cláusula\s+\d+[ªº]?\.)/,
          '<strong>$1</strong>'
        );
        return `<p style="text-align: ${alignment}; margin: 12pt 0; line-height: 1.5;">${formattedLine}</p>`;
      }
      
      return `<p style="text-align: ${alignment}; margin: 6pt 0; line-height: 1.5;">${formattedLine}</p>`;
    })
    .join('');
};

// Helper to format signatures with centered alignment
const formatSignatures = (signatures: string): string => {
  const blocks = signatures.split('\n\n');
  
  return blocks.map(block => {
    const lines = block.split('\n').filter(l => l.trim());
    return `
      <div style="margin: 24pt 0;">
        <p style="margin: 12pt 0;">_________________________________________________</p>
        ${lines.map(line => 
          `<p style="margin: 3pt 0;">${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`
        ).join('')}
      </div>
    `;
  }).join('');
};

export const generatePdfDocument = async (data: DocumentData, filename: string) => {
  // Create temporary invisible element with optimized formatting
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '21cm'; // A4 width
  tempDiv.style.padding = '2.5cm'; // Margins
  tempDiv.style.backgroundColor = '#ffffff';
  tempDiv.style.fontFamily = 'Times New Roman, serif';
  tempDiv.style.fontSize = '12pt';
  tempDiv.style.lineHeight = '1.5';
  tempDiv.style.color = '#000000';
  
  // Build structured HTML
  let htmlContent = '';
  
  // Title - 14pt, bold, uppercase, centered
  htmlContent += `
    <div style="text-align: center; margin-bottom: 24pt;">
      <h1 style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; margin: 0; text-transform: uppercase;">
        ${data.title}
      </h1>
    </div>
  `;
  
  // Main Parties
  if (data.parties) {
    htmlContent += `
      <div style="margin-bottom: 18pt;">
        <p style="font-weight: bold; margin-bottom: 12pt;">PARTES PRINCIPAIS</p>
        ${formatHtmlContent(data.parties, 'justify')}
      </div>
    `;
  }
  
  // Other Involved
  if (data.otherInvolved) {
    htmlContent += `
      <div style="margin-bottom: 18pt;">
        <p style="font-weight: bold; margin-bottom: 12pt;">OUTROS ENVOLVIDOS</p>
        ${formatHtmlContent(data.otherInvolved, 'justify')}
      </div>
    `;
  }
  
  // Contract body with clause detection
  htmlContent += `
    <div style="margin-bottom: 18pt;">
      ${formatHtmlContent(data.content, 'justify', true)}
    </div>
  `;
  
  // Location and Date - aligned right
  if (data.locationDate) {
    htmlContent += `
      <div style="text-align: right; margin: 24pt 0;">
        <p style="margin: 0;">${data.locationDate}</p>
      </div>
    `;
  }
  
  // Signatures - centered
  if (data.signatures) {
    htmlContent += `
      <div style="margin-top: 36pt; text-align: center;">
        ${formatSignatures(data.signatures)}
      </div>
    `;
  }
  
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);
  
  // Generate canvas and PDF
  const canvas = await html2canvas(tempDiv, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: tempDiv.scrollWidth,
    height: tempDiv.scrollHeight
  });
  
  document.body.removeChild(tempDiv);
  
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  
  // Calculate pages needed
  const ratio = pdfWidth / imgWidth;
  const scaledHeight = imgHeight * ratio;
  const totalPages = Math.ceil(scaledHeight / pdfHeight);
  
  for (let i = 0; i < totalPages; i++) {
    if (i > 0) pdf.addPage();
    
    const yOffset = -(pdfHeight * i);
    pdf.addImage(
      imgData, 
      'PNG', 
      0, 
      yOffset, 
      pdfWidth, 
      scaledHeight
    );
  }
  
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
      await generatePdfDocument(data, cleanFilename);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};
