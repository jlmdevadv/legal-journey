
import React from 'react';
import { useContract } from '../contexts/ContractContext';

const ContractPreview = () => {
  const { selectedTemplate, fillContractTemplate } = useContract();

  if (!selectedTemplate) return null;

  const filledTemplate = fillContractTemplate();
  const sections = filledTemplate.split('\n\n');

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
        return <span key={i} className="bg-yellow-100 px-1 rounded">[{part}]</span>;
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-1 print:shadow-none print:p-0" style={{ minHeight: '29.7cm' }}>
      <div 
        id="contract-preview"
        className="contract-paper p-8 text-gray-800"
      >
        {sections.map((section, index) => {
          const lines = section.split('\n');
          
          return (
            <div key={index} className="mb-6">
              {lines.map((line, lineIndex) => {
                // Check if the line is a heading (all caps)
                const isHeading = line.toUpperCase() === line && line.trim().length > 0;
                
                return (
                  <p 
                    key={lineIndex} 
                    className={`mb-1 ${isHeading ? 'font-bold text-center text-contractPrimary' : ''}`}
                  >
                    {renderContractText(line)}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContractPreview;
