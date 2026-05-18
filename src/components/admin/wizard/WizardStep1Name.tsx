import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WizardState } from './TemplateWizard';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

const WizardStep1Name = ({ state, update, onNext, onClose }: Props) => {
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!state.name.trim()) { setError('O nome do modelo é obrigatório.'); return; }
    setError('');
    onNext();
  };

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passo 1 de 6 — Nome do modelo</DialogTitle>
          <DialogDescription>Como este modelo será identificado no sistema?</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Label htmlFor="template-name">Nome do modelo</Label>
          <Input
            id="template-name"
            className="mt-2"
            placeholder="Ex: Contrato de Prestação de Serviços"
            value={state.name}
            onChange={e => { update({ name: e.target.value }); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleNext()}
            autoFocus
          />
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleNext}>Próximo →</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep1Name;
