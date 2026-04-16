import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ContractTimeline from './ContractTimeline';
import ContractPreviewModal from '@/components/ContractPreviewModal';
import { ContractEvent } from '@/types/document';

interface SavedContract {
  id: string;
  name: string;
  status: string;
  review_notes?: string | null;
  reviewed_at?: string | null;
  generated_document?: string | null;
  contract_templates?: { name: string } | null;
  share_links?: { token: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'approved' | 'rejected' | 'pending' | 'draft' }> = {
  approved:       { label: 'Aprovado',            variant: 'approved' },
  rejected:       { label: 'Reprovado',           variant: 'rejected' },
  pending_review: { label: 'Pendente de Revisão', variant: 'pending'  },
  draft:          { label: 'Rascunho',            variant: 'draft'    },
  completed:      { label: 'Finalizado',          variant: 'approved' },
};

interface SharedContractCardProps {
  contract: SavedContract;
  events: ContractEvent[];
  eventsLoading: boolean;
  onOpen: () => void;
  onNavigateToSharedLink: () => void;
  onDownload: (contractId: string) => void;
}

const SharedContractCard = ({
  contract,
  events,
  eventsLoading,
  onOpen,
  onNavigateToSharedLink,
  onDownload,
}: SharedContractCardProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [feedbackExpanded, setFeedbackExpanded] = useState(false);

  const statusConfig = STATUS_CONFIG[contract.status] ?? { label: contract.status, variant: 'draft' as const };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-sans text-sm font-medium text-foreground truncate">
              {contract.name}
            </h3>
            <Badge variant={statusConfig.variant} className="shrink-0">
              {statusConfig.label}
            </Badge>
          </div>
          {contract.contract_templates?.name && (
            <p className="text-xs text-muted-foreground">
              Template: {contract.contract_templates.name}
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-3 pt-0">
          {/* Timeline */}
          <div className="border-t border-border pt-3">
            <ContractTimeline
              events={events}
              loading={eventsLoading}
              collapsible
            />
          </div>

          {/* Ações por status */}
          <div className="border-t border-border pt-3 space-y-2">
            {contract.status === 'approved' && contract.generated_document && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setPreviewOpen(true)}
              >
                Visualizar e Baixar
              </Button>
            )}

            {contract.status === 'draft' && (
              <Button size="sm" className="w-full" onClick={onOpen}>
                Continuar Preenchimento
              </Button>
            )}

            {contract.status === 'pending_review' && (
              <p className="text-xs text-muted-foreground text-center py-1">
                Aguardando revisão do escritório.
              </p>
            )}

            {contract.status === 'rejected' && (
              <>
                {contract.review_notes && (
                  <div className="rounded border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                    <p className="text-xs font-medium text-destructive">Feedback do Revisor</p>
                    <p
                      className={`text-xs text-foreground whitespace-pre-wrap ${
                        feedbackExpanded ? '' : 'line-clamp-3'
                      }`}
                    >
                      {contract.review_notes}
                    </p>
                    {contract.review_notes.length > 120 && (
                      <button
                        onClick={() => setFeedbackExpanded(!feedbackExpanded)}
                        className="text-xs text-muted-foreground underline hover:text-foreground"
                      >
                        {feedbackExpanded ? 'ver menos' : 'ver mais'}
                      </button>
                    )}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={contract.share_links?.token ? onNavigateToSharedLink : onOpen}
                >
                  Editar e Reenviar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {contract.generated_document && (
        <ContractPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          content={contract.generated_document}
          contractName={contract.name}
          contractId={contract.id}
          actorRole="user"
        />
      )}
    </>
  );
};

export default SharedContractCard;
