import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePartyRegistry } from '@/hooks/usePartyRegistry';
import { PartyRegistryEntry, PersonType } from '@/types/template';
import { toast } from 'sonner';

type FormState = Omit<PartyRegistryEntry, 'id' | 'owner_id' | 'created_at'>;

const emptyForm = (): FormState => ({
  name: '',
  person_type: 'PF',
});

const PartyRegistrySection = () => {
  const { entries, loading, add, update, remove } = usePartyRegistry();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PartyRegistryEntry | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (entry: PartyRegistryEntry) => {
    setEditing(entry);
    setForm({
      name: entry.name,
      person_type: entry.person_type,
      document: entry.document,
      nationality: entry.nationality,
      marital_status: entry.marital_status,
      profession: entry.profession,
      address: entry.address,
      city: entry.city,
      state: entry.state,
      email: entry.email,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório.'); return; }
    setSaving(true);
    if (editing) {
      await update(editing.id, form);
      toast.success('Parte atualizada.');
    } else {
      await add(form);
      toast.success('Parte adicionada ao cadastro.');
    }
    setSaving(false);
    setFormOpen(false);
  };

  const handleRemove = async (entry: PartyRegistryEntry) => {
    if (!confirm(`Remover "${entry.name}" do cadastro?`)) return;
    await remove(entry.id);
    toast.success('Parte removida.');
  };

  const setField = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value || undefined }));

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-xl text-foreground">Cadastro de Partes</h2>
          <div className="mt-1 h-px w-full bg-border" />
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Parte
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">Nenhuma parte cadastrada ainda.</p>
          <Button variant="outline" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />Adicionar primeira parte
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.person_type}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.document ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(entry)}>
                        <Pencil className="w-3 h-3 mr-1" />Editar
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(entry)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />Remover
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar parte' : 'Nova parte'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input className="mt-1" value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={form.person_type} onValueChange={v => setField('person_type', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{form.person_type === 'PJ' ? 'CNPJ' : 'CPF'}</Label>
                <Input className="mt-1" value={form.document ?? ''} onChange={e => setField('document', e.target.value)} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input className="mt-1" type="email" value={form.email ?? ''} onChange={e => setField('email', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Endereço</Label>
              <Input className="mt-1" value={form.address ?? ''} onChange={e => setField('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input className="mt-1" value={form.city ?? ''} onChange={e => setField('city', e.target.value)} />
              </div>
              <div>
                <Label>Estado (UF)</Label>
                <Input className="mt-1" maxLength={2} value={form.state ?? ''} onChange={e => setField('state', e.target.value)} />
              </div>
            </div>
            {form.person_type === 'PF' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nacionalidade</Label>
                    <Input className="mt-1" value={form.nationality ?? ''} onChange={e => setField('nationality', e.target.value)} />
                  </div>
                  <div>
                    <Label>Estado civil</Label>
                    <Input className="mt-1" value={form.marital_status ?? ''} onChange={e => setField('marital_status', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Profissão</Label>
                  <Input className="mt-1" value={form.profession ?? ''} onChange={e => setField('profession', e.target.value)} />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PartyRegistrySection;
