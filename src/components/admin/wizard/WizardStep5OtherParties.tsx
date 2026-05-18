import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { WizardState } from './TemplateWizard';
import { PersonType } from '@/types/template';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SUGGESTED_OTHER_ROLES = ['Testemunha', 'Avalista', 'Interveniente', 'Garantidor'];

const WizardStep5OtherParties = ({ state, update, onNext, onBack }: Props) => {
  const [roleInput, setRoleInput] = useState('');
  const cfg = state.otherPartiesConfig;

  const toggleOther = (enabled: boolean) => update({ allowOtherParties: enabled });

  const toggleType = (type: PersonType) => {
    const current = cfg.acceptedTypes;
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    if (next.length === 0) return;
    update({ otherPartiesConfig: { ...cfg, acceptedTypes: next } });
  };

  const addRole = (role: string) => {
    const trimmed = role.trim();
    if (!trimmed || cfg.roles.includes(trimmed)) return;
    update({ otherPartiesConfig: { ...cfg, roles: [...cfg.roles, trimmed] } });
    setRoleInput('');
  };

  const removeRole = (role: string) =>
    update({ otherPartiesConfig: { ...cfg, roles: cfg.roles.filter(r => r !== role) } });

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passo 5 de 6 — Outras partes</DialogTitle>
          <DialogDescription>
            Outras partes são testemunhas, avalistas e similares — não os contratantes principais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={state.allowOtherParties}
              onCheckedChange={v => toggleOther(!!v)}
            />
            <span className="text-sm font-medium">Este modelo admite outras partes</span>
          </label>

          {state.allowOtherParties && (
            <>
              <div>
                <Label>Tipos aceitos</Label>
                <div className="flex gap-6 mt-3">
                  {(['PF', 'PJ'] as PersonType[]).map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={cfg.acceptedTypes.includes(type)}
                        onCheckedChange={() => toggleType(type)}
                      />
                      <span className="text-sm">{type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Papéis permitidos</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Ex: Testemunha"
                    value={roleInput}
                    onChange={e => setRoleInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addRole(roleInput)}
                  />
                  <Button variant="outline" size="icon" onClick={() => addRole(roleInput)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {cfg.roles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {cfg.roles.map(role => (
                      <Badge key={role} variant="secondary" className="gap-1 pr-1">
                        {role}
                        <button onClick={() => removeRole(role)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {SUGGESTED_OTHER_ROLES.filter(r => !cfg.roles.includes(r)).map(role => (
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
            </>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>← Voltar</Button>
          <Button onClick={onNext}>Próximo →</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep5OtherParties;
