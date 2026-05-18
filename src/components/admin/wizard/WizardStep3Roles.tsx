import React from 'react';
import { WizardState } from './TemplateWizard';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const WizardStep3Roles = (_props: Props) => null;

export default WizardStep3Roles;
