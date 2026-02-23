import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ContractTemplate } from '@/types/template';
import Navbar from '@/components/Navbar';
import GenerateLinkModal from '@/components/master/GenerateLinkModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Clock, CheckCircle, Edit, Link2, Trash2, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrgDocument {
  id: string;
  name: string;
  status: string;
  submitted_for_review_at: string | null;
  updated_at: string;
  user_id: string;
}

const MasterDashboard = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docFilter, setDocFilter] = useState('all');
  const [linkModal, setLinkModal] = useState<{ open: boolean; templateId: string; templateName: string }>({
    open: false, templateId: '', templateName: ''
  });

  const fetchTemplates = async () => {
    if (!organization) return;
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('organization_id', organization.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const mapped: ContractTemplate[] = (data || []).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        template: t.template,
        fields: Array.isArray(t.fields) ? (t.fields as any[]) : [],
        usePartySystem: t.use_party_system ?? true,
        version: t.version as any,
        organization_id: t.organization_id,
      }));

      setTemplates(mapped);
    } catch (error: any) {
      toast.error('Erro ao carregar templates: ' + error.message);
    }
  };

  const fetchDocuments = async () => {
    if (!organization) return;
    try {
      const { data, error } = await supabase
        .from('saved_contracts')
        .select('id, name, status, submitted_for_review_at, updated_at, user_id')
        .eq('organization_id', organization.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar documentos: ' + error.message);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTemplates(), fetchDocuments()]);
      setLoading(false);
    };
    load();
  }, [organization]);

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!organization) return;
    if (!confirm(`Tem certeza que deseja excluir o modelo "${templateName}"?`)) return;

    try {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', templateId)
        .eq('organization_id', organization.id);

      if (error) throw error;

      toast.success('Modelo excluído com sucesso!');
      fetchTemplates();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const limitReached = organization ? templates.length >= organization.templates_limit : false;

  const pendingCount = documents.filter(d => d.status === 'pending_review').length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;

  const filteredDocs = documents.filter(d => {
    if (docFilter === 'all') return true;
    return d.status === docFilter;
  });

  const statusMap: Record<string, { label: string; variant: any }> = {
    draft:          { label: 'Rascunho',   variant: 'draft'     },
    pending_review: { label: 'Pendente',   variant: 'pending'   },
    approved:       { label: 'Aprovado',   variant: 'approved'  },
    rejected:       { label: 'Reprovado',  variant: 'rejected'  },
    completed:      { label: 'Finalizado', variant: 'approved'  },
  };

  if (!organization) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Organização não encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-10 pt-2">
          <h1 className="font-serif text-3xl text-foreground">{organization.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Painel de gerenciamento</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Templates</p>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif text-foreground mt-2">{templates.length}/{organization.templates_limit}</div>
              <p className="text-xs text-muted-foreground">Modelos criados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Pendentes</p>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif text-foreground mt-2">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Aguardando revisão</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Finalizados</p>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif text-foreground mt-2">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Documentos aprovados</p>
            </CardContent>
          </Card>
        </div>

        {/* Limit Warning */}
        {limitReached && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm">
              Você atingiu o limite de {organization.templates_limit} modelos. 
              Entre em contato para aumentar seu plano.
            </p>
          </div>
        )}

        {/* Templates Section */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-xl text-foreground">Modelos</h2>
            <div className="mt-1 h-px w-full bg-border" />
          </div>
          <Button onClick={() => navigate('/master/template/new')} disabled={limitReached}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Modelo
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : templates.length === 0 ? (
          <Card className="text-center py-12 mb-8">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum modelo criado</h3>
              <p className="text-muted-foreground mb-4">Comece criando seu primeiro modelo de contrato.</p>
              <Button onClick={() => navigate('/master/template/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Modelo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile template list */}
            <div className="sm:hidden flex flex-col gap-3 mb-8">
              {templates.map((t) => (
                <div key={t.id} className="rounded border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-sans text-sm font-medium text-foreground">{t.name}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{t.fields.length} campos</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/master/template/${t.id}`)}>
                      <Edit className="w-3 h-3 mr-1" />Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setLinkModal({ open: true, templateId: t.id, templateName: t.name })}>
                      <Link2 className="w-3 h-3 mr-1" />Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop template table */}
            <Card className="mb-8 hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Campos</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.fields.length}</TableCell>
                      <TableCell>{t.version?.version || '1.0'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/master/template/${t.id}`)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLinkModal({ open: true, templateId: t.id, templateName: t.name })}
                          >
                            <Link2 className="w-4 h-4 mr-1" />
                            Gerar Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(t.id, t.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        {/* Documents Section */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-foreground">Documentos Recebidos</h2>
          <div className="flex items-center gap-3">
            <select
              value={docFilter}
              onChange={(e) => setDocFilter(e.target.value)}
              className="h-9 rounded border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Todos ({documents.length})</option>
              <option value="pending_review">Pendentes ({pendingCount})</option>
              <option value="approved">Aprovados ({approvedCount})</option>
              <option value="rejected">Reprovados ({rejectedCount})</option>
            </select>
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">Nenhum documento encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile document cards */}
            <div className="sm:hidden flex flex-col gap-3">
              {filteredDocs.map((doc) => {
                const s = statusMap[doc.status] || { label: doc.status, variant: 'outline' as const };
                return (
                  <div key={doc.id} className="rounded border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-foreground">{doc.name}</p>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                    {doc.submitted_for_review_at && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {format(new Date(doc.submitted_for_review_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                    <Button variant="outline" size="sm" onClick={() => navigate(`/master/review/${doc.id}`)}>
                      <Eye className="w-3 h-3 mr-1" />Ver
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Desktop document table */}
            <Card className="hidden sm:block">
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
                  {filteredDocs.map((doc) => {
                    const info = statusMap[doc.status] || { label: doc.status, variant: 'outline' as const };
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>
                          <Badge variant={info.variant}>{info.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {doc.submitted_for_review_at
                            ? format(new Date(doc.submitted_for_review_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            : format(new Date(doc.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/master/review/${doc.id}`)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Revisar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </main>

      <GenerateLinkModal
        open={linkModal.open}
        onOpenChange={(open) => setLinkModal(prev => ({ ...prev, open }))}
        templateId={linkModal.templateId}
        templateName={linkModal.templateName}
      />
    </div>
  );
};

export default MasterDashboard;
