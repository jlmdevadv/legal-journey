import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContract } from '@/contexts/ContractContext';

import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import QuestionnaireForm from '@/components/QuestionnaireForm';
import ContractPreview from '@/components/ContractPreview';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { ContractTemplate } from '@/types/template';

interface SharedQuestionnaireContainerProps {
  templateId: string;
  organizationId: string;
  organizationName: string;
  templateName: string;
  shareLinkId: string;
}

const SharedQuestionnaireContainer = ({
  templateId,
  organizationId,
  organizationName,
  templateName,
  shareLinkId,
}: SharedQuestionnaireContainerProps) => {
  const { user } = useAuth();
  const { selectTemplate, selectedTemplate, generateFinalDocument, getContractingParties, getOtherInvolved, getSignatures, getLocationDate } = useContract();
  const [loading, setLoading] = useState(true);
  const [savedContractId, setSavedContractId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplateAndDocument();
  }, [templateId]);

  const loadTemplateAndDocument = async () => {
    if (!user) return;

    try {
      // Load template
      const { data: tmpl, error: tmplError } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (tmplError) throw tmplError;

      const mapped: ContractTemplate = {
        id: tmpl.id,
        name: tmpl.name,
        description: tmpl.description || '',
        template: tmpl.template,
        fields: Array.isArray(tmpl.fields) ? (tmpl.fields as any[]) : [],
        usePartySystem: tmpl.use_party_system ?? true,
        version: tmpl.version as any,
        organization_id: tmpl.organization_id,
      };

      selectTemplate(mapped);

      // Check for existing document for this user + share_link
      const { data: existing } = await supabase
        .from('saved_contracts')
        .select('id')
        .eq('user_id', user.id)
        .eq('share_link_id', shareLinkId)
        .limit(1)
        .maybeSingle();

      if (existing) {
        setSavedContractId(existing.id);
      } else {
        // Create new document linked to org
        const { data: newDoc, error: insertError } = await supabase
          .from('saved_contracts')
          .insert({
            user_id: user.id,
            template_id: templateId,
            name: `${templateName} - ${new Date().toLocaleDateString('pt-BR')}`,
            organization_id: organizationId,
            share_link_id: shareLinkId,
            status: 'draft',
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        setSavedContractId(newDoc.id);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!savedContractId || !user) return;

    try {
      // Build the full document text for the master to review
      const finalDoc = generateFinalDocument();
      const parties = getContractingParties();
      const otherInvolved = getOtherInvolved();
      const signatures = getSignatures();
      const locationDate = getLocationDate();

      const fullDocument = [
        parties ? `PARTES PRINCIPAIS\n\n${parties}` : '',
        otherInvolved ? `OUTROS ENVOLVIDOS\n\n${otherInvolved}` : '',
        finalDoc,
        locationDate ? `\n${locationDate}` : '',
        signatures ? `ASSINATURAS\n\n${signatures}` : '',
      ].filter(Boolean).join('\n\n');

      const { error } = await supabase
        .from('saved_contracts')
        .update({
          status: 'pending_review',
          submitted_for_review_at: new Date().toISOString(),
          generated_document: fullDocument,
        })
        .eq('id', savedContractId);

      if (error) throw error;

      toast.success('Documento enviado para revisão!');
    } catch (error: any) {
      toast.error('Erro ao enviar para revisão: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Organization banner */}
      <div className="bg-primary/5 border-b border-primary/20 py-3">
        <div className="container mx-auto px-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">
            Preenchimento para <strong>{organizationName}</strong>
          </span>
          <Badge variant="outline" className="text-xs">{templateName}</Badge>
        </div>
      </div>

      {selectedTemplate && (
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2 print:hidden">
              <QuestionnaireForm
                isSharedContext={true}
                onSubmitForReview={handleSubmitForReview}
              />
            </div>
            <div className="md:w-1/2 print:w-full">
              <div className="sticky top-6">
                <ScrollArea className="h-[calc(100vh-8rem)]" data-contract-preview-scroll>
                  <ContractPreview />
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedQuestionnaireContainer;
