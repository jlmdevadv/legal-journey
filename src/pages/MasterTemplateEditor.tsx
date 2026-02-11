import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ContractTemplate } from '@/types/template';
import TemplateEditor from '@/components/admin/TemplateEditor';
import { toast } from 'sonner';

const generateId = () => {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const MasterTemplateEditor = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { organization, user } = useAuth();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const isNew = templateId === 'new';

  useEffect(() => {
    if (!organization) return;

    if (isNew) {
      const newTemplate: ContractTemplate = {
        id: generateId(),
        name: 'Novo Modelo',
        description: '',
        template: '',
        fields: [],
        usePartySystem: true,
        organization_id: organization.id,
      };
      setTemplate(newTemplate);
      setLoading(false);
    } else {
      loadTemplate();
    }
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
        navigate('/master');
        return;
      }

      setTemplate({
        id: data.id,
        name: data.name,
        description: data.description || '',
        template: data.template,
        fields: Array.isArray(data.fields) ? (data.fields as any[]) : [],
        usePartySystem: data.use_party_system ?? true,
        version: data.version as any,
        organization_id: data.organization_id,
      });
    } catch (error: any) {
      toast.error('Erro ao carregar modelo: ' + error.message);
      navigate('/master');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedTemplate: ContractTemplate) => {
    if (!organization || !user) return;

    try {
      const record = {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        description: updatedTemplate.description || null,
        template: updatedTemplate.template,
        fields: updatedTemplate.fields as any,
        use_party_system: updatedTemplate.usePartySystem ?? true,
        version: updatedTemplate.version as any,
        organization_id: organization.id,
        last_modified_by: user.email || null,
      };

      if (isNew) {
        const { error } = await supabase
          .from('contract_templates')
          .insert({ ...record, created_by: user.email || null });

        if (error) throw error;
        toast.success('Modelo criado com sucesso!');
      } else {
        const { error } = await supabase
          .from('contract_templates')
          .update(record)
          .eq('id', updatedTemplate.id)
          .eq('organization_id', organization.id);

        if (error) throw error;
        toast.success('Modelo salvo com sucesso!');
      }

      navigate('/master');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  const handleCancel = () => {
    navigate('/master');
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
