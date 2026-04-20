import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrgDocument } from '@/hooks/useDashboardData';

const STATUS_MAP: Record<string, { label: string; variant: 'approved' | 'draft' | 'pending' | 'rejected' }> = {
  draft:          { label: 'Rascunho',   variant: 'draft'    },
  pending_review: { label: 'Pendente',   variant: 'pending'  },
  approved:       { label: 'Aprovado',   variant: 'approved' },
  rejected:       { label: 'Reprovado',  variant: 'rejected' },
  completed:      { label: 'Finalizado', variant: 'approved' },
};

interface Props {
  documents: OrgDocument[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

const DocumentosCompartilhadosSection = ({
  documents,
  pendingCount,
  approvedCount,
  rejectedCount,
}: Props) => {
  const navigate = useNavigate();
  const [docFilter, setDocFilter] = useState('all');

  const filtered = documents
    .filter(d => docFilter === 'all' || d.status === docFilter)
    .sort((a, b) => {
      const aPending = a.status === 'pending_review' ? 0 : 1;
      const bPending = b.status === 'pending_review' ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-xl text-foreground">Documentos Compartilhados</h2>
          <div className="mt-1 h-px w-full bg-border" />
        </div>
        <select
          value={docFilter}
          onChange={e => setDocFilter(e.target.value)}
          className="h-9 rounded border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos ({documents.length})</option>
          <option value="pending_review">Pendentes ({pendingCount})</option>
          <option value="approved">Aprovados ({approvedCount})</option>
          <option value="rejected">Reprovados ({rejectedCount})</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(doc => {
                const s = STATUS_MAP[doc.status] ?? { label: doc.status, variant: 'draft' as const };
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.submitted_for_review_at
                        ? format(new Date(doc.submitted_for_review_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : format(new Date(doc.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={doc.status === 'pending_review' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => navigate(`/master/review/${doc.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {doc.status === 'pending_review' ? 'Revisar' : 'Ver'}
                      </Button>
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

export default DocumentosCompartilhadosSection;
