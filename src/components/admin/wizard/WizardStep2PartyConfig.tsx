import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { WizardState } from './TemplateWizard';
import { PersonType } from '@/types/template';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const WizardStep2PartyConfig = ({ state, update, onNext, onBack }: Props) => {
  const toggleType = (type: PersonType) => {
    const current = state.acceptedTypes;
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    if (next.length === 0) return; // ao menos um tipo deve estar marcado
    update({ acceptedTypes: next });
  };

  const isValid =
    state.minParties >= 1 &&
    state.maxParties >= state.minParties &&
    state.acceptedTypes.length > 0;

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passo 2 de 6 — Configuração de partes</DialogTitle>
          <DialogDescription>Defina quantas partes este modelo aceita e quais tipos.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-parties">Mínimo de partes</Label>
              <Input
                id="min-parties"
                type="number"
                min={1}
                className="mt-2"
                value={state.minParties}
                onChange={e => {
                  const min = Math.max(1, parseInt(e.target.value) || 1);
                  update({ minParties: min, maxParties: Math.max(state.maxParties, min) });
                }}
              />
            </div>
            <div>
              <Label htmlFor="max-parties">Máximo de partes</Label>
              <Input
                id="max-parties"
                type="number"
                min={state.minParties}
                className="mt-2"
                value={state.maxParties}
                onChange={e => {
                  const max = Math.max(state.minParties, parseInt(e.target.value) || state.minParties);
                  update({ maxParties: max });
                }}
              />
            </div>
          </div>

          <div>
            <Label>Tipos de pessoa aceitos</Label>
            <div className="flex gap-6 mt-3">
              {(['PF', 'PJ'] as PersonType[]).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={state.acceptedTypes.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                  />
                  <span className="text-sm">{type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>← Voltar</Button>
          <Button onClick={onNext} disabled={!isValid}>Próximo →</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep2PartyConfig;
