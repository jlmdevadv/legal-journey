import React from 'react';
import { WizardState } from './TemplateWizard';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void;
  saving: boolean;
  onClose: () => void;
}

const WizardStep6Summary = (_props: Props) => null;

export default WizardStep6Summary;
