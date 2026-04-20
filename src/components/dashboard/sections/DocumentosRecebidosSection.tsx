import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import ContractPreviewModal from '@/components/ContractPreviewModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardContract } from '@/hooks/useDashboardData';

const STATUS_MAP: Record<string, { label: string; variant: 'approved' | 'draft' | 'pending' | 'rejected' }> = {
  draft:          { label: 'Rascunho',           variant: 'draft'    },
  pending_review: { label: 'Aguardando Revisão', variant: 'pending'  },
  approved:       { label: 'Aprovado',           variant: 'approved' },
  rejected:       { label: 'Reprovado',          variant: 'rejected' },
};

interface Props {
  docs: DashboardContract[];
}

const DocumentosRecebidosSection = ({ docs }: Props) => {
  const navigate = useNavigate();
  const [previewContract, setPreviewContract] = useState<DashboardContract | null>(null);

  if (docs.length === 0) {
    return (
      <section className="mb-10">
        <div className="mb-5">
          <h2 className="font-serif text-xl text-foreground">Documentos Recebidos</h2>
          <div className="mt-1 h-px w-full bg-border" />
        </div>
        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
            Nenhum documento recebido para preenchimento.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="mb-5">
        <h2 className="font-serif text-xl text-foreground">Documentos Recebidos</h2>
        <div className="mt-1 h-px w-full bg-border" />
      </div>

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
            {docs.map(doc => {
              const s = STATUS_MAP[doc.status] ?? { label: doc.status, variant: 'draft' as const };
              return (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {doc.contract_templates?.name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(doc.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {doc.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => navigate(doc.share_links?.token ? `/s/${doc.share_links.token}` : '/')}
                        >
                          Preencher
                        </Button>
                      )}
                      {doc.status === 'rejected' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => navigate(doc.share_links?.token ? `/s/${doc.share_links.token}` : '/')}
                        >
                          Editar e Reenviar
                        </Button>
                      )}
                      {doc.status === 'approved' && doc.generated_document && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewContract(doc)}
                        >
                          Visualizar e Baixar
                        </Button>
                      )}
                      {doc.status === 'pending_review' && (
                        <span className="text-xs text-muted-foreground py-2">
                          Enviado para revisão
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {previewContract && previewContract.generated_document && (
        <ContractPreviewModal
          open={!!previewContract}
          onOpenChange={open => { if (!open) setPreviewContract(null); }}
          content={previewContract.generated_document}
          contractName={previewContract.name}
          contractId={previewContract.id}
          actorRole="user"
          showDownload={true}
        />
      )}
    </section>
  );
};

export default DocumentosRecebidosSection;
