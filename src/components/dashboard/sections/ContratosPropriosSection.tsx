import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContract } from '@/contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardContract } from '@/hooks/useDashboardData';

const STATUS_MAP: Record<string, { label: string; variant: 'approved' | 'draft' | 'pending' | 'rejected' }> = {
  draft:     { label: 'Rascunho',  variant: 'draft'    },
  completed: { label: 'Concluído', variant: 'approved' },
  archived:  { label: 'Arquivado', variant: 'draft'    },
};

interface Props {
  contracts: DashboardContract[];
  onReload: () => void;
}

const ContratosPropriosSection = ({ contracts, onReload }: Props) => {
  const navigate = useNavigate();
  const { loadContract, deleteContract } = useContract();
  const [filter, setFilter] = useState('all');

  const filtered = contracts.filter(c => filter === 'all' || c.status === filter);

  const handleOpen = async (id: string) => {
    const ok = await loadContract(id);
    if (ok) navigate('/');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este contrato?')) return;
    const ok = await deleteContract(id);
    if (ok) onReload();
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-xl text-foreground">Contratos Próprios</h2>
          <div className="mt-1 h-px w-full bg-border" />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="h-9 rounded border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos ({contracts.length})</option>
            <option value="draft">Rascunhos ({contracts.filter(c => c.status === 'draft').length})</option>
            <option value="completed">Concluídos ({contracts.filter(c => c.status === 'completed').length})</option>
          </select>
          <Button onClick={() => navigate('/')}>
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-border rounded-lg">
          <FileText className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum contrato encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Contrato
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Atualizado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => {
                const s = STATUS_MAP[c.status] ?? { label: c.status, variant: 'draft' as const };
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.contract_templates?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(c.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {c.status === 'draft' ? (
                          <Button size="sm" onClick={() => handleOpen(c.id)}>
                            Continuar
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleOpen(c.id)}>
                            Visualizar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(c.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};

export default ContratosPropriosSection;
