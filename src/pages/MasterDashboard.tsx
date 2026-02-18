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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Rascunho', variant: 'outline' },
    pending_review: { label: 'Pendente', variant: 'secondary' },
    approved: { label: 'Aprovado', variant: 'default' },
    rejected: { label: 'Reprovado', variant: 'destructive' },
    completed: { label: 'Finalizado', variant: 'default' },
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
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{organization.name}</h1>
          <p className="text-muted-foreground mt-1">Painel de gerenciamento de modelos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Templates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}/{organization.templates_limit}</div>
              <p className="text-xs text-muted-foreground">Modelos criados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Aguardando revisão</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Finalizados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Seus Modelos</h2>
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
          <Card className="mb-8">
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
        )}

        {/* Documents Section */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Documentos Recebidos</h2>
          <Tabs value={docFilter} onValueChange={setDocFilter}>
            <TabsList>
              <TabsTrigger value="all">Todos ({documents.length})</TabsTrigger>
              <TabsTrigger value="pending_review">Pendentes ({pendingCount})</TabsTrigger>
              <TabsTrigger value="approved">Aprovados ({approvedCount})</TabsTrigger>
              <TabsTrigger value="rejected">Reprovados ({rejectedCount})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredDocs.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">Nenhum documento encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
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
