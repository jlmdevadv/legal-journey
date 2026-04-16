import React from 'react';
import { useContract } from '@/contexts/ContractContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import DocumentDownloader from './DocumentDownloader';

interface ContractPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Props opcionais para uso standalone (ex: SharedContractCard)
  content?: string | null;
  contractName?: string;
  contractId?: string | null;
  actorRole?: 'master' | 'user';
}

const ContractPreviewModal = ({ open, onOpenChange, content, contractName, contractId, actorRole }: ContractPreviewModalProps) => {
  const {
    selectedTemplate,
    fillContractTemplate,
    getContractingParties,
    getOtherInvolved,
    getSignatures,
    getLocationDate
  } = useContract();

  // Modo standalone: usa props de conteúdo direto (sem contexto)
  const isStandalone = !!content;

  if (!isStandalone && !selectedTemplate) return null;

  const renderContractText = (text: string) => {
    const combinedRegex = /(\*\*.*?\*\*|\[[\w-]+\])/g;
    const parts = text.split(combinedRegex);

    if (parts.length <= 1) return text;

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('[') && part.endsWith(']')) {
        return <span key={i} className="bg-yellow-50 px-1 rounded border border-yellow-200 text-yellow-800">[{part.slice(1, -1)}]</span>;
      }
      return part;
    });
  };

  const renderSection = (title: string, sectionContent: string, isEmpty: boolean = false) => {
    if (isEmpty && !sectionContent.trim()) return null;

    return (
      <div className="mb-8">
        {title && (
          <h2 className="font-bold text-center text-blue-800 text-lg mb-4 uppercase">
            {title}
          </h2>
        )}
        {sectionContent.split('\n').map((line, index) => (
          <p key={index} className="mb-2">
            {renderContractText(line)}
          </p>
        ))}
      </div>
    );
  };

  // Modo context: monta document data a partir do ContractContext
  const filledTemplate = isStandalone ? '' : fillContractTemplate();
  const contractingParties = isStandalone ? '' : getContractingParties();
  const otherInvolved = isStandalone ? '' : getOtherInvolved();
  const signatures = isStandalone ? '' : getSignatures();
  const locationDate = isStandalone ? '' : getLocationDate();

  const getDocumentData = () => ({
    title: isStandalone ? (contractName ?? '') : selectedTemplate!.name,
    content: isStandalone ? (content ?? '') : filledTemplate,
    parties: contractingParties,
    otherInvolved: otherInvolved,
    signatures: signatures,
    locationDate: locationDate,
  });

  const displayName = isStandalone ? (contractName ?? 'Contrato') : selectedTemplate!.name;

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
            style={{ fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: '1.5' }}
          >
            {isStandalone ? (
              // Modo standalone: renderiza conteúdo como texto puro (seguro contra XSS)
              <div className="contract-paper whitespace-pre-wrap break-words">
                {content}
              </div>
            ) : (
              // Modo context: renderiza a partir do ContractContext
              <>
                <div className="mb-8 text-center">
                  <h1 className="font-bold text-xl text-blue-800 uppercase">
                    {displayName}
                  </h1>
                </div>
                {contractingParties && renderSection('Partes Principais', contractingParties)}
                {otherInvolved && renderSection('Outros Envolvidos', otherInvolved)}
                {renderSection('', filledTemplate)}
                {locationDate && (
                  <div className="mb-8 text-right">
                    <p className="text-gray-800">{locationDate}</p>
                  </div>
                )}
                {signatures && renderSection('Assinaturas', signatures)}
              </>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
          <DocumentDownloader
            documentData={getDocumentData()}
            filename={displayName}
            elementId="contract-preview-modal"
            variant="outline"
            contractId={contractId}
            actorRole={actorRole}
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
