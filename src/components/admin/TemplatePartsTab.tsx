import React, { useState } from 'react';
import { ContractTemplate, PartyConfig, FixedParty, PersonType, PartyRegistryEntry } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Trash2, BookUser } from 'lucide-react';
import PartyRegistryLookup from './PartyRegistryLookup';

interface TemplatePartsTabProps {
  template: ContractTemplate;
  onChange: (config: PartyConfig) => void;
}

const defaultConfig = (): PartyConfig => ({
  minParties: 2,
  maxParties: 2,
  acceptedTypes: ['PF', 'PJ'],
  roles: [],
  allowOtherParties: false,
  fixedParties: [],
});

const TemplatePartsTab = ({ template, onChange }: TemplatePartsTabProps) => {
  const config: PartyConfig = template.partyConfig ?? defaultConfig();
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupTarget, setLookupTarget] = useState<{ section: 'main' | 'other'; index: number } | null>(null);
  const [roleInput, setRoleInput] = useState('');
  const [otherRoleInput, setOtherRoleInput] = useState('');

  const update = (patch: Partial<PartyConfig>) => onChange({ ...config, ...patch });

  const toggleType = (type: PersonType) => {
    const next = config.acceptedTypes.includes(type)
      ? config.acceptedTypes.filter(t => t !== type)
      : [...config.acceptedTypes, type];
    if (next.length === 0) return;
    update({ acceptedTypes: next });
  };

  const addRole = (role: string) => {
    const trimmed = role.trim();
    if (!trimmed || config.roles.includes(trimmed)) return;
    update({ roles: [...config.roles, trimmed] });
    setRoleInput('');
  };

  const removeRole = (role: string) => update({ roles: config.roles.filter(r => r !== role) });

  const updateFixed = (index: number, patch: Partial<FixedParty>) =>
    update({ fixedParties: config.fixedParties.map((p, i) => i === index ? { ...p, ...patch } : p) });

  const removeFixed = (index: number) =>
    update({ fixedParties: config.fixedParties.filter((_, i) => i !== index) });

  const addFixed = () =>
    update({ fixedParties: [...config.fixedParties, { role: '', name: '', personType: 'PF' }] });

  const otherCfg = config.otherPartiesConfig ?? { acceptedTypes: ['PF', 'PJ'], roles: [], fixedParties: [] };

  const updateOtherCfg = (patch: Partial<typeof otherCfg>) =>
    update({ otherPartiesConfig: { ...otherCfg, ...patch } });

  const handleRegistrySelect = (entry: PartyRegistryEntry) => {
    if (!lookupTarget) return;
    const mapped: Partial<FixedParty> = {
      registryId: entry.id,
      name: entry.name,
      personType: entry.person_type,
      document: entry.document ?? undefined,
      email: entry.email ?? undefined,
    };
    if (lookupTarget.section === 'main') {
      updateFixed(lookupTarget.index, mapped);
    } else {
      const fixed = [...(otherCfg.fixedParties ?? [])];
      fixed[lookupTarget.index] = { ...fixed[lookupTarget.index], ...mapped };
      updateOtherCfg({ fixedParties: fixed });
    }
    setLookupTarget(null);
  };

  return (
    <div className="space-y-8 py-4">
      {/* Configuração geral */}
      <Card>
        <CardHeader><CardTitle className="text-base">Configuração geral</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mínimo de partes</Label>
              <Input
                type="number" min={1} className="mt-1"
                value={config.minParties}
                onChange={e => {
                  const min = Math.max(1, parseInt(e.target.value) || 1);
                  update({ minParties: min, maxParties: Math.max(config.maxParties, min) });
                }}
              />
            </div>
            <div>
              <Label>Máximo de partes</Label>
              <Input
                type="number" min={config.minParties} className="mt-1"
                value={config.maxParties}
                onChange={e => {
                  const max = Math.max(config.minParties, parseInt(e.target.value) || config.minParties);
                  update({ maxParties: max });
                }}
              />
            </div>
          </div>
          <div>
            <Label>Tipos aceitos</Label>
            <div className="flex gap-6 mt-2">
              {(['PF', 'PJ'] as PersonType[]).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={config.acceptedTypes.includes(type)} onCheckedChange={() => toggleType(type)} />
                  <span className="text-sm">{type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Papéis */}
      <Card>
        <CardHeader><CardTitle className="text-base">Papéis das partes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar papel..." value={roleInput}
              onChange={e => setRoleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRole(roleInput)}
            />
            <Button variant="outline" size="icon" onClick={() => addRole(roleInput)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {config.roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.roles.map(role => (
                <Badge key={role} variant="secondary" className="gap-1 pr-1">
                  {role}
                  <button onClick={() => removeRole(role)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partes fixas */}
      <Card>
        <CardHeader><CardTitle className="text-base">Partes fixas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {config.fixedParties.map((party, i) => (
            <div key={i} className="border border-border rounded-lg p-3 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Parte fixa {i + 1}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setLookupTarget({ section: 'main', index: i }); setLookupOpen(true); }}>
                    <BookUser className="w-4 h-4 mr-1" />Cadastro
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeFixed(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Papel</Label>
                  <Select value={party.role} onValueChange={v => updateFixed(i, { role: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {config.roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={party.personType} onValueChange={v => updateFixed(i, { personType: v as PersonType })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Nome</Label>
                <Input className="mt-1" value={party.name} onChange={e => updateFixed(i, { name: e.target.value })} />
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={addFixed}>
            <Plus className="w-4 h-4 mr-2" />Adicionar parte fixa
          </Button>
        </CardContent>
      </Card>

      {/* Outras partes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Outras partes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={config.allowOtherParties}
              onCheckedChange={v => update({ allowOtherParties: !!v })}
            />
            <span className="text-sm">Este modelo admite testemunhas, avalistas e similares</span>
          </label>

          {config.allowOtherParties && (
            <>
              <div>
                <Label>Tipos aceitos</Label>
                <div className="flex gap-6 mt-2">
                  {(['PF', 'PJ'] as PersonType[]).map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={otherCfg.acceptedTypes.includes(type)}
                        onCheckedChange={() => {
                          const next = otherCfg.acceptedTypes.includes(type)
                            ? otherCfg.acceptedTypes.filter(t => t !== type)
                            : [...otherCfg.acceptedTypes, type];
                          if (next.length > 0) updateOtherCfg({ acceptedTypes: next });
                        }}
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
                    placeholder="Ex: Testemunha" value={otherRoleInput}
                    onChange={e => setOtherRoleInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const trimmed = otherRoleInput.trim();
                        if (trimmed && !otherCfg.roles.includes(trimmed)) {
                          updateOtherCfg({ roles: [...otherCfg.roles, trimmed] });
                          setOtherRoleInput('');
                        }
                      }
                    }}
                  />
                  <Button variant="outline" size="icon" onClick={() => {
                    const trimmed = otherRoleInput.trim();
                    if (trimmed && !otherCfg.roles.includes(trimmed)) {
                      updateOtherCfg({ roles: [...otherCfg.roles, trimmed] });
                      setOtherRoleInput('');
                    }
                  }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {otherCfg.roles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {otherCfg.roles.map(role => (
                      <Badge key={role} variant="secondary" className="gap-1 pr-1">
                        {role}
                        <button onClick={() => updateOtherCfg({ roles: otherCfg.roles.filter(r => r !== role) })} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PartyRegistryLookup
        open={lookupOpen}
        onOpenChange={open => { setLookupOpen(open); if (!open) setLookupTarget(null); }}
        onSelect={handleRegistrySelect}
      />
    </div>
  );
};

export default TemplatePartsTab;
