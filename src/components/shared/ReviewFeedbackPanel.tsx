import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReviewFeedbackPanelProps {
  reviewNotes: string;
  reviewedAt?: string | null;
  contractId: string;
}

const storageKey = (id: string) => `feedback-panel-${id}`;

const ReviewFeedbackPanel = ({ reviewNotes, reviewedAt, contractId }: ReviewFeedbackPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = sessionStorage.getItem(storageKey(contractId));
    return stored === null ? true : stored === 'expanded';
  });

  useEffect(() => {
    sessionStorage.setItem(storageKey(contractId), isExpanded ? 'expanded' : 'collapsed');
  }, [isExpanded, contractId]);

  if (!reviewNotes) return null;

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-20 right-6 z-50 flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-full px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors shadow-md"
      >
        <MessageSquare className="w-4 h-4" />
        Feedback do Revisor
        <ChevronUp className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 w-80 shadow-lg">
      <div className="bg-background border border-destructive/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquare className="w-4 h-4 text-destructive" />
            Feedback do Revisor
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Minimizar"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        {reviewedAt && (
          <p className="text-xs text-muted-foreground mb-2">
            Revisado em {format(new Date(reviewedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{reviewNotes}</p>
      </div>
    </div>
  );
};

export default ReviewFeedbackPanel;
