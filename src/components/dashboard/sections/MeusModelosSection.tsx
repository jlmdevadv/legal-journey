import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ContractTemplate } from '@/types/template';
import GenerateLinkModal from '@/components/master/GenerateLinkModal';
import ContentModal from '@/components/admin/ContentModal';
import TemplateWizard from '@/components/admin/wizard/TemplateWizard';

interface Props {
  templates: ContractTemplate[];
  onReload: () => void;
}

const MeusModelosSection = ({ templates, onReload }: Props) => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [linkModal, setLinkModal] = useState<{ open: boolean; templateId: string; templateName: string }>({
    open: false, templateId: '', templateName: '',
  });
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pendingContent, setPendingContent] = useState('');

  const limitReached = organization ? templates.length >= organization.templates_limit : false;

  const handleContentConfirm = (content: string) => {
    setPendingContent(content);
    setContentModalOpen(false);
    setWizardOpen(true);
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!organization) return;
    if (!confirm(`Excluir o modelo "${templateName}"?`)) return;
    const { error } = await supabase
      .from('contract_templates')
      .delete()
      .eq('id', templateId)
      .eq('organization_id', organization.id);
    if (error) { toast.error('Erro ao excluir: ' + error.message); return; }
    toast.success('Modelo excluído.');
    onReload();
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-xl text-foreground">Meus Modelos</h2>
          <div className="mt-1 h-px w-full bg-border" />
        </div>
        <Button onClick={() => setContentModalOpen(true)} disabled={limitReached}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Modelo
        </Button>
      </div>

      {limitReached && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Limite de {organization?.templates_limit} modelos atingido. Entre em contato para ampliar seu plano.
          </p>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">Nenhum modelo criado ainda.</p>
          <Button onClick={() => setContentModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Modelo
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
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
              {templates.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.fields.length}</TableCell>
                  <TableCell className="text-muted-foreground">{(t.version as any)?.version ?? '1.0'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/master/template/${t.id}`)}>
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLinkModal({ open: true, templateId: t.id, templateName: t.name })}
                      >
                        Gerar Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(t.id, t.name)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <GenerateLinkModal
        open={linkModal.open}
        onOpenChange={open => setLinkModal(prev => ({ ...prev, open }))}
        templateId={linkModal.templateId}
        templateName={linkModal.templateName}
      />

      <ContentModal
        open={contentModalOpen}
        onOpenChange={setContentModalOpen}
        onConfirm={handleContentConfirm}
      />

      <TemplateWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        initialContent={pendingContent}
      />
    </section>
  );
};

export default MeusModelosSection;
