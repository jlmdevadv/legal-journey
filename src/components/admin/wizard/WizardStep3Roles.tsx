import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { WizardState } from './TemplateWizard';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SUGGESTED_ROLES = ['Contratante', 'Contratado', 'Outorgante', 'Outorgado', 'Fiador', 'Interveniente'];

const WizardStep3Roles = ({ state, update, onNext, onBack }: Props) => {
  const [input, setInput] = useState('');

  const addRole = (role: string) => {
    const trimmed = role.trim();
    if (!trimmed || state.roles.includes(trimmed)) return;
    update({ roles: [...state.roles, trimmed] });
    setInput('');
  };

  const removeRole = (role: string) =>
    update({ roles: state.roles.filter(r => r !== role) });

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passo 3 de 6 — Papéis das partes</DialogTitle>
          <DialogDescription>
            Defina quais papéis existem neste modelo. Os preenchedores escolherão dentre estas opções.
            Pode ter mais ou menos papéis do que o número de partes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Contratante"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRole(input)}
            />
            <Button variant="outline" size="icon" onClick={() => addRole(input)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {state.roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {state.roles.map(role => (
                <Badge key={role} variant="secondary" className="gap-1 pr-1">
                  {role}
                  <button onClick={() => removeRole(role)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_ROLES.filter(r => !state.roles.includes(r)).map(role => (
                <button
                  key={role}
                  onClick={() => addRole(role)}
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                >
                  + {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>← Voltar</Button>
          <Button onClick={onNext}>Próximo →</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep3Roles;
