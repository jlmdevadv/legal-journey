import React from 'react';
import { useContract } from '@/contexts/ContractContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, X } from 'lucide-react';
import DocumentDownloader from './DocumentDownloader';

interface ContractPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContractPreviewModal = ({ open, onOpenChange }: ContractPreviewModalProps) => {
  const { 
    selectedTemplate, 
    fillContractTemplate, 
    getContractingParties, 
    getOtherInvolved, 
    getSignatures,
    getLocationDate
  } = useContract();

  if (!selectedTemplate) return null;

  const filledTemplate = fillContractTemplate();
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

  const getDocumentData = () => ({
    title: selectedTemplate.name,
    content: filledTemplate,
    parties: contractingParties,
    otherInvolved: otherInvolved,
    signatures: signatures,
    locationDate: locationDate
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl text-contractPrimary">
            Visualização do Contrato
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <div 
            id="contract-preview-modal"
            className="bg-white p-8 text-gray-800"
            style={{
              fontFamily: 'Times New Roman, serif',
              fontSize: '12pt',
              lineHeight: '1.5'
            }}
          >
            {/* Título */}
            <div className="mb-8 text-center">
              <h1 className="font-bold text-xl text-blue-800 uppercase">
                {selectedTemplate.name}
              </h1>
            </div>

            {/* Partes Principais */}
            {contractingParties && renderSection('Partes Principais', contractingParties)}

            {/* Outros Envolvidos */}
            {otherInvolved && renderSection('Outros Envolvidos', otherInvolved)}

            {/* Corpo do Contrato */}
            {renderSection('', filledTemplate)}

            {/* Local e Data */}
            {locationDate && (
              <div className="mb-8 text-right">
                <p className="text-gray-800">{locationDate}</p>
              </div>
            )}

            {/* Assinaturas */}
            {signatures && renderSection('Assinaturas', signatures)}
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
          <Button 
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          <DocumentDownloader
            documentData={getDocumentData()}
            filename={selectedTemplate.name}
            elementId="contract-preview-modal"
            variant="outline"
          />
          <Button 
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractPreviewModal;
