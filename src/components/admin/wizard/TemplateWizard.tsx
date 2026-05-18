import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PartyConfig, FixedParty, OtherPartiesConfig, PersonType } from '@/types/template';
import { toast } from 'sonner';
import WizardStep1Name from './WizardStep1Name';
import WizardStep2PartyConfig from './WizardStep2PartyConfig';
import WizardStep3Roles from './WizardStep3Roles';
import WizardStep4FixedParties from './WizardStep4FixedParties';
import WizardStep5OtherParties from './WizardStep5OtherParties';
import WizardStep6Summary from './WizardStep6Summary';

export interface WizardState {
  content: string;
  name: string;
  minParties: number;
  maxParties: number;
  acceptedTypes: PersonType[];
  roles: string[];
  fixedParties: FixedParty[];
  allowOtherParties: boolean;
  otherPartiesConfig: OtherPartiesConfig;
}

interface TemplateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent: string;
}

const TOTAL_STEPS = 6;

const TemplateWizard = ({ open, onOpenChange, initialContent }: TemplateWizardProps) => {
  const { organization, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<WizardState>({
    content: initialContent,
    name: '',
    minParties: 2,
    maxParties: 2,
    acceptedTypes: ['PF', 'PJ'],
    roles: [],
    fixedParties: [],
    allowOtherParties: false,
    otherPartiesConfig: { acceptedTypes: ['PF', 'PJ'], roles: [], fixedParties: [] },
  });

  const update = (patch: Partial<WizardState>) =>
    setState(prev => ({ ...prev, ...patch }));

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const handleClose = () => {
    setStep(1);
    setState({
      content: '',
      name: '',
      minParties: 2,
      maxParties: 2,
      acceptedTypes: ['PF', 'PJ'],
      roles: [],
      fixedParties: [],
      allowOtherParties: false,
      otherPartiesConfig: { acceptedTypes: ['PF', 'PJ'], roles: [], fixedParties: [] },
    });
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!organization || !user) return;
    setSaving(true);
    try {
      const partyConfig: PartyConfig = {
        minParties: state.minParties,
        maxParties: state.maxParties,
        acceptedTypes: state.acceptedTypes,
        roles: state.roles,
        allowOtherParties: state.allowOtherParties,
        fixedParties: state.fixedParties,
        otherPartiesConfig: state.allowOtherParties ? state.otherPartiesConfig : undefined,
      };

      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          id: crypto.randomUUID(),
          name: state.name,
          description: '',
          template: state.content,
          fields: [],
          use_party_system: true,
          party_config: partyConfig as any,
          organization_id: organization.id,
          created_by: user.email ?? null,
        })
        .select('id')
        .single();

      if (error) throw error;
      toast.success('Modelo criado! Agora configure os campos e cláusulas.');
      handleClose();
      navigate(`/master/template/${data.id}`);
    } catch (error: any) {
      toast.error('Erro ao criar modelo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Re-sync content when initialContent changes (new modal open)
  React.useEffect(() => {
    if (open) setState(prev => ({ ...prev, content: initialContent }));
  }, [open, initialContent]);

  if (!open) return null;

  const stepProps = { state, update, onNext: next, onBack: back };

  return (
    <>
      {step === 1 && <WizardStep1Name {...stepProps} onClose={handleClose} />}
      {step === 2 && <WizardStep2PartyConfig {...stepProps} />}
      {step === 3 && <WizardStep3Roles {...stepProps} />}
      {step === 4 && <WizardStep4FixedParties {...stepProps} />}
      {step === 5 && <WizardStep5OtherParties {...stepProps} />}
      {step === 6 && <WizardStep6Summary {...stepProps} onConfirm={handleConfirm} saving={saving} onClose={handleClose} />}
    </>
  );
};

export default TemplateWizard;
