import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Loader2, FileText, User, Calendar } from 'lucide-react';
import DocumentDownloader from '@/components/DocumentDownloader';
import ContractTimeline from '@/components/contracts/ContractTimeline';
import { ContractEvent } from '@/types/document';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MasterReview = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const [document, setDocument] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    if (documentId && organization) {
      fetchDocument();
    }
  }, [documentId, organization]);

  const fetchDocument = async () => {
    try {
      const { data: doc, error } = await supabase
        .from('saved_contracts')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      setDocument(doc);
      setReviewNotes(doc.review_notes || '');

      // Fetch de eventos do contrato
      setEventsLoading(true);
      const { data: eventsData } = await supabase
        .from('contract_events')
        .select('*')
        .eq('contract_id', documentId)
        .order('occurred_at', { ascending: true });

      setEvents((eventsData as ContractEvent[]) ?? []);
      setEventsLoading(false);

      if (doc.template_id) {
        const { data: tmpl } = await supabase
          .from('contract_templates')
          .select('*')
          .eq('id', doc.template_id)
          .single();
        setTemplate(tmpl);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar documento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!user || !documentId) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('saved_contracts')
        .update({
          status,
          reviewed_by_user_id: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', documentId);

      if (error) throw error;

      await supabase.from('contract_events').insert({
        contract_id: documentId,
        user_id: user.id,
        event_type: status === 'approved' ? 'review_approved' : 'review_rejected',
        metadata: status === 'rejected' && reviewNotes
          ? { notes: reviewNotes }
          : null,
      });

      toast.success(status === 'approved' ? 'Documento aprovado!' : 'Documento reprovado.');
      navigate('/master');
    } catch (error: any) {
      toast.error('Erro ao revisar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Documento não encontrado.</p>
          <Button variant="outline" onClick={() => navigate('/master')} className="mt-4">
            Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; variant: any }> = {
    pending_review: { label: 'Pendente',  variant: 'pending'   },
    approved:       { label: 'Aprovado',  variant: 'approved'  },
    rejected:       { label: 'Reprovado', variant: 'rejected'  },
    draft:          { label: 'Rascunho',  variant: 'draft'     },
  };

  const statusInfo = statusMap[document.status] || { label: document.status, variant: 'outline' as const };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/master')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Painel
        </Button>

        <div className="grid gap-6">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <h1 className="font-serif text-xl text-foreground">{document.name}</h1>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {template && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  Template: {template.name}
                </div>
              )}
              {document.submitted_for_review_at && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Enviado em: {format(new Date(document.submitted_for_review_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
              )}
              {/* Timeline de eventos */}
              <div className="border-t border-border pt-3 mt-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">Histórico</p>
                <ContractTimeline
                  events={events}
                  loading={eventsLoading}
                  collapsible={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Generated Document Preview */}
          {document.generated_document && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg">Prévia do Documento</CardTitle>
                  <DocumentDownloader
                    documentData={{
                      title: document.name,
                      content: document.generated_document,
                      parties: '',
                      otherInvolved: '',
                      signatures: '',
                      locationDate: '',
                    }}
                    filename={document.name}
                    variant="outline"
                    size="sm"
                    contractId={documentId}
                    actorRole="master"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="contract-paper rounded border border-border max-h-[60vh] sm:max-h-[500px] overflow-y-auto whitespace-pre-wrap break-words text-sm">
                  {document.generated_document}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Draft info */}
          {document.status === 'draft' && (
            <Card className="border-orange-300/50 bg-orange-50/50">
              <CardContent className="py-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-foreground">Preenchimento em andamento</p>
                  <p className="text-xs text-muted-foreground">Este documento ainda está sendo preenchido pelo usuário. Os botões de revisão aparecerão após o envio.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Actions */}
          {document.status === 'pending_review' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revisão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Observações (opcional)</label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Adicione observações sobre esta revisão..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleReview('approved')}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => handleReview('rejected')}
                    disabled={isSubmitting}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Reprovar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
};

export default MasterReview;
