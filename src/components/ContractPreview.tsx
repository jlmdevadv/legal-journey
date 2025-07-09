
import React from 'react';
import { useContract } from '../contexts/ContractContext';

const ContractPreview = () => {
  const { 
    selectedTemplate, 
    fillContractTemplate, 
    getContractingParties, 
    getOtherInvolved, 
    getSignatures 
  } = useContract();

  if (!selectedTemplate) return null;

  const filledTemplate = fillContractTemplate();
  const contractingParties = getContractingParties();
  const otherInvolved = getOtherInvolved();
  const signatures = getSignatures();

  const renderContractText = (text: string) => {
    // Replace placeholders with highlighted spans
    const placeholderRegex = /\[([\w-]+)\]/g;
    const parts = text.split(placeholderRegex);
    
    if (parts.length <= 1) return text;
    
    return parts.map((part, i) => {
      // Even indexes are normal text, odd indexes are the captured groups from regex
      if (i % 2 === 0) {
        return part;
      } else {
        // This is a placeholder field
        return <span key={i} className="bg-yellow-50 px-1 rounded border border-yellow-200 text-yellow-800">[{part}]</span>;
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
      >
        {/* 1. Título */}
        <div className="mb-8 text-center">
          <h1 className="font-bold text-xl text-blue-800 uppercase">
            {selectedTemplate.name}
          </h1>
        </div>

        {/* 2. Partes Contratantes */}
        {contractingParties && renderSection('Partes Contratantes', contractingParties)}

        {/* 3. Outros Envolvidos */}
        {otherInvolved && renderSection('Outros Envolvidos', otherInvolved)}

        {/* 4. Corpo do Contrato */}
        {renderSection('', filledTemplate)}

        {/* 5. Assinaturas */}
        {signatures && renderSection('Assinaturas', signatures)}
      </div>
    </div>
  );
};

export default ContractPreview;
