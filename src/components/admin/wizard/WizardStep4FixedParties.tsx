import React from 'react';
import { WizardState } from './TemplateWizard';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const WizardStep4FixedParties = (_props: Props) => null;

export default WizardStep4FixedParties;
