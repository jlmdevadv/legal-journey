import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (fileName: string, content: string): Promise<void> => {
  const container = document.createElement('div');
  container.id = 'pdf-generator-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.minHeight = '297mm';
  container.style.padding = '20mm';
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.fontFamily = 'Times New Roman, serif';
  container.style.fontSize = '12pt';
  container.style.lineHeight = '1.5';
  container.style.whiteSpace = 'pre-wrap';
  container.style.textAlign = 'justify';

  // Título via textContent para evitar injeção de HTML
  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'margin-bottom: 30px; text-align: center; font-weight: bold; font-size: 14pt; text-transform: uppercase;';
  titleEl.textContent = fileName;
  container.appendChild(titleEl);

  // Conteúdo: converter markdown bold e newlines para HTML
  const formattedContent = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

  const contentEl = document.createElement('div');
  contentEl.innerHTML = formattedContent;
  container.appendChild(contentEl);

  document.body.appendChild(container);

  try {
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${fileName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
};
