import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContract } from '@/contexts/ContractContext';

import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import ReviewFeedbackPanel from './ReviewFeedbackPanel';
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
  const {
    selectTemplate, selectedTemplate, generateFinalDocument,
    getContractingParties, getOtherInvolved, getSignatures, getLocationDate,
    formValues, partiesData, numberOfParties, otherPartiesData, numberOfOtherParties,
    hasOtherParties, locationData, repeatableFieldsData,
    currentQuestionIndex, currentPartyLoopIndex,
    loadContract,
  } = useContract();
  const [loading, setLoading] = useState(true);
  const [savedContractId, setSavedContractId] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [contractReviewNotes, setContractReviewNotes] = useState<string | null>(null);
  const [contractReviewedAt, setContractReviewedAt] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<string>('draft');
  const prevQuestionIndexRef = useRef(currentQuestionIndex);

  useEffect(() => {
    loadTemplateAndDocument();
  }, [templateId]);

  useEffect(() => {
    if (!savedContractId || prevQuestionIndexRef.current === currentQuestionIndex) return;
    prevQuestionIndexRef.current = currentQuestionIndex;
    saveFormState(savedContractId);
  }, [currentQuestionIndex, savedContractId]);

  const saveFormState = async (contractId: string) => {
    await supabase
      .from('saved_contracts')
      .update({
        form_values: formValues,
        parties_data: partiesData,
        number_of_parties: numberOfParties,
        other_parties_data: otherPartiesData,
        number_of_other_parties: numberOfOtherParties,
        has_other_parties: hasOtherParties,
        location_data: locationData,
        repeatable_fields_data: repeatableFieldsData,
        current_question_index: currentQuestionIndex,
        current_party_loop_index: currentPartyLoopIndex,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', contractId);
  };

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
        .select('id, review_notes, reviewed_at, status')
        .eq('user_id', user.id)
        .eq('share_link_id', shareLinkId)
        .limit(1)
        .maybeSingle();

      if (existing) {
        setSavedContractId(existing.id);
        setContractReviewNotes((existing as any).review_notes || null);
        setContractReviewedAt((existing as any).reviewed_at || null);
        setContractStatus((existing as any).status || 'draft');
        // Hydrate context with saved form data so the questionnaire is pre-filled
        await loadContract(existing.id);
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
          form_values: formValues,
          parties_data: partiesData,
          number_of_parties: numberOfParties,
          other_parties_data: otherPartiesData,
          number_of_other_parties: numberOfOtherParties,
          has_other_parties: hasOtherParties,
          location_data: locationData,
          repeatable_fields_data: repeatableFieldsData,
          current_question_index: currentQuestionIndex,
          current_party_loop_index: currentPartyLoopIndex,
        })
        .eq('id', savedContractId);

      if (error) throw error;

      toast.success('Documento enviado para revisão!');
      setContractStatus('pending_review');
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
            {/* Desktop: both panels. Mobile: form only (preview via button) */}
            <div className={`${showMobilePreview ? 'hidden' : 'block'} md:block md:w-1/2 print:hidden`}>
              <QuestionnaireForm
                isSharedContext={true}
                onSubmitForReview={handleSubmitForReview}
              />
              {/* Mobile preview toggle */}
              <button
                className="md:hidden mt-4 w-full flex items-center justify-center gap-2 h-11 rounded border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-surface-secondary transition-colors"
                onClick={() => setShowMobilePreview(true)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                Ver prévia do contrato
              </button>
            </div>
            <div className={`${showMobilePreview ? 'block' : 'hidden'} md:block md:w-1/2 print:w-full`}>
              {showMobilePreview && (
                <button
                  className="md:hidden mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setShowMobilePreview(false)}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Voltar ao formulário
                </button>
              )}
              <div className="sticky top-6">
                <ScrollArea className="h-[calc(100vh-8rem)]" data-contract-preview-scroll>
                  <ContractPreview />
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      )}
      {contractStatus === 'rejected' && contractReviewNotes && savedContractId && (
        <ReviewFeedbackPanel
          reviewNotes={contractReviewNotes}
          reviewedAt={contractReviewedAt}
          contractId={savedContractId}
        />
      )}
    </div>
  );
};

export default SharedQuestionnaireContainer;
