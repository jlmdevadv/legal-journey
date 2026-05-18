import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { WizardState } from './TemplateWizard';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}

const WizardStep6Summary = ({ state, onBack, onConfirm, saving }: Props) => {
  const rows: [string, string][] = [
    ['Nome', state.name],
    ['Mínimo de partes', String(state.minParties)],
    ['Máximo de partes', String(state.maxParties)],
    ['Tipos aceitos', state.acceptedTypes.join(', ')],
    ['Papéis', state.roles.length > 0 ? state.roles.join(', ') : '(nenhum definido)'],
    ['Partes fixas', state.fixedParties.length > 0
      ? state.fixedParties.map(p => `${p.name} (${p.role || 'sem papel'})`).join('; ')
      : 'Nenhuma'],
    ['Outras partes', state.allowOtherParties
      ? `Sim — papéis: ${state.otherPartiesConfig.roles.join(', ') || 'livre'}`
      : 'Não'],
  ];

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passo 6 de 6 — Resumo</DialogTitle>
          <DialogDescription>Confirme as configurações antes de criar o modelo.</DialogDescription>
        </DialogHeader>

        <dl className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-3 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-right max-w-[60%]">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex justify-between mt-2">
          <Button variant="outline" onClick={onBack} disabled={saving}>← Voltar</Button>
          <Button onClick={onConfirm} disabled={saving}>
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>
            ) : (
              <><Check className="w-4 h-4 mr-2" />Confirmar e criar modelo</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep6Summary;
