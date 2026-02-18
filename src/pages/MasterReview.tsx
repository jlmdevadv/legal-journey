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

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending_review: { label: 'Pendente', variant: 'secondary' },
    approved: { label: 'Aprovado', variant: 'default' },
    rejected: { label: 'Reprovado', variant: 'destructive' },
    draft: { label: 'Rascunho', variant: 'outline' },
  };

  const statusInfo = statusMap[document.status] || { label: document.status, variant: 'outline' as const };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/master')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Painel
        </Button>

        <div className="grid gap-6">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {document.name}
                </CardTitle>
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
            </CardContent>
          </Card>

          {/* Generated Document Preview */}
          {document.generated_document && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prévia do Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none bg-white p-6 rounded border whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: document.generated_document }}
                />
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
                    className="flex-1 bg-green-600 hover:bg-green-700"
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

          {/* Already reviewed info */}
          {(document.status === 'approved' || document.status === 'rejected') && document.reviewed_at && (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">
                  Revisado em {format(new Date(document.reviewed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
                {document.review_notes && (
                  <p className="text-sm mt-2">Observações: {document.review_notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default MasterReview;
