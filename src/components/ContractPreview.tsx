
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
    const conditionalRegex = /(\{\{#if\s+[^}]+\}\}|\{\{\/if\}\})/g;
    
    // Split by bold, placeholder, and conditional patterns
    const combinedRegex = /(\*\*.*?\*\*|\[[\w-]+\]|\{\{#if\s+[^}]+\}\}|\{\{\/if\}\})/g;
    const parts = text.split(combinedRegex);
    
    if (parts.length <= 1) return text;
    
    return parts.map((part, i) => {
      // Check if it's a conditional tag
      if (part.includes('{{#if') || part.includes('{{/if}}')) {
        return <span key={i} className="bg-muted px-1 rounded-sm border border-border text-muted-foreground font-mono text-[11px]">{part}</span>;
      }
      // Check if it's a bold marker
      else if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={i} className="font-bold">{boldText}</strong>;
      }
      // Check if it's a placeholder
      else if (part.startsWith('[') && part.endsWith(']')) {
        const fieldName = part.slice(1, -1);
        return <span key={i} className="bg-surface-secondary px-1 rounded-sm border border-border text-primary font-sans text-[13px]">[{fieldName}]</span>;
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
          <h2 className="font-serif text-base text-primary font-normal text-center mb-4 uppercase tracking-wide">
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
    <div className="rounded border border-border print:shadow-none print:border-0 print:p-0 break-words whitespace-pre-wrap w-full" style={{ minHeight: '29.7cm' }}>
      <div
        id="contract-preview"
        className="contract-paper"
      >
        {/* 1. Título */}
        <div id="preview-section-title" className="mb-8 text-center">
          <h1 className="font-serif text-xl text-primary font-normal uppercase">
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
              <p className="text-foreground">{locationDate}</p>
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
