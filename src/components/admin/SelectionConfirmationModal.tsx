import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface SelectionConfirmationModalProps {
  open: boolean;
  selectedText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const SelectionConfirmationModal = ({
  open,
  selectedText,
  onConfirm,
  onCancel
}: SelectionConfirmationModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            Criar campo editável?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Texto selecionado:</p>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium">{selectedText}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            Deseja transformar este texto em um campo editável? 
            <br />
            Caso contrário, a seleção permanecerá ativa para edição ou exclusão.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Não, apenas selecionar
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Sim, criar campo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectionConfirmationModal;
