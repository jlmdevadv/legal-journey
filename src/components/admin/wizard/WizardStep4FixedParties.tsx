import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, BookUser } from 'lucide-react';
import { WizardState } from './TemplateWizard';
import { FixedParty, PartyRegistryEntry, PersonType } from '@/types/template';
import { usePartyRegistry } from '@/hooks/usePartyRegistry';
import PartyRegistryLookup from '../PartyRegistryLookup';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const emptyFixedParty = (): FixedParty => ({
  role: '',
  name: '',
  personType: 'PF',
});

const WizardStep4FixedParties = ({ state, update, onNext, onBack }: Props) => {
  const { add: addToRegistry } = usePartyRegistry();
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupTargetIndex, setLookupTargetIndex] = useState<number | null>(null);

  const addFixed = () =>
    update({ fixedParties: [...state.fixedParties, emptyFixedParty()] });

  const removeFixed = (index: number) =>
    update({ fixedParties: state.fixedParties.filter((_, i) => i !== index) });

  const updateFixed = (index: number, patch: Partial<FixedParty>) =>
    update({
      fixedParties: state.fixedParties.map((p, i) => i === index ? { ...p, ...patch } : p),
    });

  const openLookup = (index: number) => {
    setLookupTargetIndex(index);
    setLookupOpen(true);
  };

  const handleRegistrySelect = async (entry: PartyRegistryEntry) => {
    if (lookupTargetIndex === null) return;
    updateFixed(lookupTargetIndex, {
      registryId: entry.id,
      name: entry.name,
      personType: entry.person_type,
      document: entry.document ?? undefined,
      nationality: entry.nationality ?? undefined,
      maritalStatus: entry.marital_status ?? undefined,
      profession: entry.profession ?? undefined,
      address: entry.address ?? undefined,
      city: entry.city ?? undefined,
      state: entry.state ?? undefined,
      email: entry.email ?? undefined,
    });
    setLookupTargetIndex(null);
  };

  const handleSaveToRegistry = async (index: number) => {
    const party = state.fixedParties[index];
    if (!party.name) return;
    const saved = await addToRegistry({
      name: party.name,
      person_type: party.personType,
      document: party.document,
      nationality: party.nationality,
      marital_status: party.maritalStatus,
      profession: party.profession,
      address: party.address,
      city: party.city,
      state: party.state,
      email: party.email,
    });
    if (saved) updateFixed(index, { registryId: saved.id });
  };

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Passo 4 de 6 — Partes fixas</DialogTitle>
          <DialogDescription>
            Partes fixas já vêm preenchidas no modelo. O preenchedor as verá como somente leitura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {state.fixedParties.map((party, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Parte fixa {i + 1}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openLookup(i)}>
                      <BookUser className="w-4 h-4 mr-1" />
                      Buscar cadastro
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeFixed(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Papel</Label>
                    <Select
                      value={party.role}
                      onValueChange={v => updateFixed(i, { role: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {state.roles.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={party.personType}
                      onValueChange={v => updateFixed(i, { personType: v as PersonType })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Nome</Label>
                  <Input
                    className="mt-1"
                    placeholder="Nome completo ou razão social"
                    value={party.name}
                    onChange={e => updateFixed(i, { name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{party.personType === 'PJ' ? 'CNPJ' : 'CPF'}</Label>
                    <Input
                      className="mt-1"
                      value={party.document ?? ''}
                      onChange={e => updateFixed(i, { document: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      className="mt-1"
                      type="email"
                      value={party.email ?? ''}
                      onChange={e => updateFixed(i, { email: e.target.value })}
                    />
                  </div>
                </div>

                {!party.registryId && party.name && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSaveToRegistry(i)}
                  >
                    + Salvar no Cadastro de Partes
                  </Button>
                )}
                {party.registryId && (
                  <p className="text-xs text-muted-foreground">✓ Vinculado ao Cadastro de Partes</p>
                )}
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full" onClick={addFixed}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar parte fixa
          </Button>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>← Voltar</Button>
          <Button onClick={onNext}>Próximo →</Button>
        </div>

        <PartyRegistryLookup
          open={lookupOpen}
          onOpenChange={setLookupOpen}
          onSelect={handleRegistrySelect}
        />
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep4FixedParties;
