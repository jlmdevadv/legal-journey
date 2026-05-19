import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ContractTemplate } from '@/types/template';
import TemplateEditor from '@/components/admin/TemplateEditor';
import { toast } from 'sonner';

const MasterTemplateEditor = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { organization, user } = useAuth();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    if (templateId === 'new') {
      navigate('/dashboard', { replace: true });
      return;
    }
    loadTemplate();
  }, [templateId, organization]);

  const loadTemplate = async () => {
    if (!organization || !templateId) return;

    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', templateId)
        .eq('organization_id', organization.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Modelo não encontrado');
        navigate('/dashboard');
        return;
      }

      setTemplate({
        id: data.id,
        name: data.name,
        description: data.description || '',
        template: data.template,
        fields: Array.isArray(data.fields) ? (data.fields as any[]) : [],
        usePartySystem: data.use_party_system ?? true,
        partyConfig: data.party_config as any ?? undefined,
        version: data.version as any,
        organization_id: data.organization_id,
      });
    } catch (error: any) {
      toast.error('Erro ao carregar modelo: ' + error.message);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedTemplate: ContractTemplate) => {
    if (!organization || !user) return;

    try {
      const record = {
        name: updatedTemplate.name,
        description: updatedTemplate.description || null,
        template: updatedTemplate.template,
        fields: updatedTemplate.fields as any,
        use_party_system: updatedTemplate.usePartySystem ?? true,
        party_config: updatedTemplate.partyConfig as any ?? null,
        version: updatedTemplate.version as any,
        organization_id: organization.id,
        last_modified_by: user.email || null,
      };

      const { error } = await supabase
        .from('contract_templates')
        .update(record)
        .eq('id', updatedTemplate.id)
        .eq('organization_id', organization.id);

      if (error) throw error;
      toast.success('Modelo salvo com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <TemplateEditor
      template={template}
      onSave={handleSave}
      onCancel={handleCancel}
      isMasterContext
    />
  );
};

export default MasterTemplateEditor;
