import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RenameTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onConfirm: (newName: string) => void;
}

export const RenameTemplateModal = ({ open, onOpenChange, currentName, onConfirm }: RenameTemplateModalProps) => {
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNewName(currentName);
      setError('');
    }
  }, [open, currentName]);

  const handleConfirm = () => {
    if (!newName.trim()) {
      setError('O nome não pode estar vazio');
      return;
    }

    onConfirm(newName.trim());
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renomear Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Novo nome do template</Label>
            <Input
              id="template-name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Digite o novo nome"
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Renomear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
