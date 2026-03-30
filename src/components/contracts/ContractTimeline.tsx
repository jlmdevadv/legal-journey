import React, { useState } from 'react';
import {
  Link2, Eye, Send, CheckCircle, XCircle, Download, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContractEvent } from '@/types/document';

const COLLAPSED_COUNT = 3;

const EVENT_CONFIG: Record<
  ContractEvent['event_type'],
  { label: string; Icon: React.ElementType; colorClass: string }
> = {
  link_created: {
    label: 'Link gerado pelo escritório',
    Icon: Link2,
    colorClass: 'text-muted-foreground',
  },
  contract_accessed: {
    label: 'Preenchedor acessou o contrato',
    Icon: Eye,
    colorClass: 'text-muted-foreground',
  },
  submitted_for_review: {
    label: 'Enviado para revisão',
    Icon: Send,
    colorClass: 'text-primary',
  },
  review_approved: {
    label: 'Aprovado pelo revisor',
    Icon: CheckCircle,
    colorClass: 'text-green-600',
  },
  review_rejected: {
    label: 'Reprovado pelo revisor',
    Icon: XCircle,
    colorClass: 'text-destructive',
  },
  document_downloaded: {
    label: 'Download realizado',
    Icon: Download,
    colorClass: 'text-muted-foreground',
  },
};

interface ContractTimelineProps {
  events: ContractEvent[];
  loading?: boolean;
  collapsible?: boolean; // se true, exibe máx COLLAPSED_COUNT eventos com "ver mais"
}

const ContractTimeline = ({ events, loading = false, collapsible = false }: ContractTimelineProps) => {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando histórico...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-1">Nenhum evento registrado.</p>
    );
  }

  const visible = collapsible && !expanded ? events.slice(0, COLLAPSED_COUNT) : events;
  const hasMore = collapsible && events.length > COLLAPSED_COUNT;

  return (
    <div className="space-y-0">
      {visible.map((event, index) => {
        const config = EVENT_CONFIG[event.event_type];
        if (!config) return null;
        const { label, Icon, colorClass } = config;
        const isLast = index === visible.length - 1;
        const rejectionNotes =
          event.event_type === 'review_rejected' &&
          event.metadata &&
          typeof event.metadata['notes'] === 'string'
            ? (event.metadata['notes'] as string)
            : null;

        return (
          <div key={event.id} className="flex gap-3">
            {/* Linha conectora */}
            <div className="flex flex-col items-center">
              <div className={`mt-0.5 rounded-full p-0.5 ${colorClass}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-1" />}
            </div>

            {/* Conteúdo */}
            <div className={`pb-3 min-w-0 ${isLast ? '' : ''}`}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(event.occurred_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
              </div>
              {rejectionNotes && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  "{rejectionNotes}"
                </p>
              )}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground underline hover:text-foreground mt-1 ml-6"
        >
          {expanded ? 'ver menos' : `ver mais ${events.length - COLLAPSED_COUNT} evento(s)`}
        </button>
      )}
    </div>
  );
};

export default ContractTimeline;
