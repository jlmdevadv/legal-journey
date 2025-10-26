
import React from 'react';
import { useContract } from '../contexts/ContractContext';

const ContractPreview = () => {
  const { 
    selectedTemplate, 
    generatePreviewText, 
    getContractingParties, 
    getOtherInvolved, 
    getSignatures,
    getLocationDate
  } = useContract();

  if (!selectedTemplate) return null;

  const filledTemplate = generatePreviewText();
  const contractingParties = getContractingParties();
  const otherInvolved = getOtherInvolved();
  const signatures = getSignatures();
  const locationDate = getLocationDate();

  const renderContractText = (text: string) => {
    // First handle bold markers (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    const placeholderRegex = /\[([\w-]+)\]/g;
    
    // Split by both bold and placeholder patterns
    const combinedRegex = /(\*\*.*?\*\*|\[[\w-]+\])/g;
    const parts = text.split(combinedRegex);
    
    if (parts.length <= 1) return text;
    
    return parts.map((part, i) => {
      // Check if it's a bold marker
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={i} className="font-bold">{boldText}</strong>;
      }
      // Check if it's a placeholder
      else if (part.startsWith('[') && part.endsWith(']')) {
        const fieldName = part.slice(1, -1);
        return <span key={i} className="bg-yellow-50 px-1 rounded border border-yellow-200 text-yellow-800">[{fieldName}]</span>;
      }
      // Regular text
      else {
        return part;
      }
    });
  };

  const renderSection = (title: string, content: string, isEmpty: boolean = false) => {
    if (isEmpty && !content.trim()) return null;
    
    return (
      <div className="mb-8">
        {title && (
          <h2 className="font-bold text-center text-blue-800 text-lg mb-4 uppercase">
            {title}
          </h2>
        )}
        {content.split('\n').map((line, index) => (
          <p key={index} className="mb-2">
            {renderContractText(line)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-1 print:shadow-none print:p-0 border border-gray-100" style={{ minHeight: '29.7cm' }}>
      <div 
        id="contract-preview"
        className="contract-paper p-8 text-gray-800"
        style={{
          fontFamily: 'Times New Roman, serif',
          fontSize: '12pt',
          lineHeight: '1.5'
        }}
      >
        {/* 1. Título */}
        <div id="preview-section-title" className="mb-8 text-center">
          <h1 className="font-bold text-xl text-blue-800 uppercase">
            {selectedTemplate.name}
          </h1>
        </div>

        {/* 2. Partes Principais */}
        <div id="preview-section-parties">
          {contractingParties && renderSection('Partes Principais', contractingParties)}
        </div>

        {/* 3. Outros Envolvidos */}
        <div id="preview-section-other-parties">
          {otherInvolved && renderSection('Outros Envolvidos', otherInvolved)}
        </div>

        {/* 4. Corpo do Contrato */}
        <div id="preview-section-body">
          {renderSection('', filledTemplate)}
        </div>

        {/* 5. Local e Data */}
        <div id="preview-section-location">
          {locationDate && (
            <div className="mb-8 text-right">
              <p className="text-gray-800">{locationDate}</p>
            </div>
          )}
        </div>

        {/* 6. Assinaturas */}
        <div id="preview-section-signatures">
          {signatures && renderSection('Assinaturas', signatures)}
        </div>
      </div>
    </div>
  );
};

export default ContractPreview;
