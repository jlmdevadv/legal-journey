
import React, { useMemo } from 'react';
import { useContract } from '../contexts/ContractContext';
import QuestionnaireWelcome from './questionnaire/QuestionnaireWelcome';
import QuestionnaireQuestion from './questionnaire/QuestionnaireQuestion';
import QuestionnaireSummary from './questionnaire/QuestionnaireSummary';
import PartyNumberQuestion from './questionnaire/PartyNumberQuestion';
import PartyDataCard from './questionnaire/PartyDataCard';
import LocationDateQuestion from './questionnaire/LocationDateQuestion';
import OtherPartiesQuestion from './questionnaire/OtherPartiesQuestion';
import OtherPartiesNumberQuestion from './questionnaire/OtherPartiesNumberQuestion';
import RepeatableFieldCard from './questionnaire/RepeatableFieldCard';
import { getNonRepeatableVisibleFields, getRepeatableFields } from '@/utils/conditionalLogic';
import { useContractPreviewScroll } from '@/hooks/useContractPreviewScroll';

const QuestionnaireForm = () => {
  const { 
    selectedTemplate, 
    currentQuestionIndex, 
    isQuestionnaireMode, 
    numberOfParties, 
    partiesData,
    numberOfOtherParties,
    otherPartiesData,
    formValues
  } = useContract();

  // Calculate visible fields based on conditional logic
  const visibleFields = useMemo(() => {
    if (!selectedTemplate) return [];
    return getNonRepeatableVisibleFields(selectedTemplate.fields, formValues);
  }, [selectedTemplate, formValues]);

  const repeatableFields = useMemo(() => {
    if (!selectedTemplate) return [];
    return getRepeatableFields(selectedTemplate.fields);
  }, [selectedTemplate]);

  // Auto-scroll preview to match current question
  useContractPreviewScroll(currentQuestionIndex, numberOfParties, numberOfOtherParties, selectedTemplate, formValues);

  if (!selectedTemplate) return null;

  // Show welcome screen
  if (currentQuestionIndex === -1) {
    return <QuestionnaireWelcome />;
  }

  // Show party number question
  if (currentQuestionIndex === -2) {
    return <PartyNumberQuestion />;
  }

  // Show main party data cards (indices -1000 to -1000 + numberOfParties - 1)
  if (currentQuestionIndex >= -1000 && currentQuestionIndex < -1000 + numberOfParties) {
    const partyIndex = currentQuestionIndex + 1000;
    const partyData = partiesData[partyIndex];
    const isLastParty = partyIndex === numberOfParties - 1;
    
    if (partyData) {
      return (
        <PartyDataCard
          partyIndex={partyIndex}
          partyData={partyData}
          isLastParty={isLastParty}
          category="main"
        />
      );
    }
  }

  // Show "other parties" question
  if (currentQuestionIndex === -4) {
    return <OtherPartiesQuestion />;
  }

  // Show number of other parties question
  if (currentQuestionIndex === -5) {
    return <OtherPartiesNumberQuestion />;
  }

  // Show other party data cards (indices -2000 to -2000 + numberOfOtherParties - 1)
  if (currentQuestionIndex >= -2000 && currentQuestionIndex < -2000 + numberOfOtherParties) {
    const partyIndex = currentQuestionIndex + 2000;
    const partyData = otherPartiesData[partyIndex];
    const isLastParty = partyIndex === numberOfOtherParties - 1;
    
    if (partyData) {
      return (
        <PartyDataCard
          partyIndex={partyIndex}
          partyData={partyData}
          isLastParty={isLastParty}
          category="other"
          title={`Demais Partes ${partyIndex + 1}`}
        />
      );
    }
  }

  // Show repeatable fields (indices -3000 to -3000 + totalRepeatableSteps - 1)
  if (currentQuestionIndex >= -3000) {
    const totalRepeatableSteps = numberOfParties * repeatableFields.length;
    const repeatableIndex = currentQuestionIndex + 3000;
    
    if (repeatableIndex >= 0 && repeatableIndex < totalRepeatableSteps) {
      const partyIndex = Math.floor(repeatableIndex / repeatableFields.length);
      const fieldIndex = repeatableIndex % repeatableFields.length;
      const currentField = repeatableFields[fieldIndex];
      const currentParty = partiesData[partyIndex];
      
      if (currentField && currentParty) {
        const isLastField = fieldIndex === repeatableFields.length - 1;
        const isLastParty = partyIndex === numberOfParties - 1;
        
        return (
          <RepeatableFieldCard
            field={currentField}
            partyId={currentParty.id}
            partyName={currentParty.fullName}
            partyIndex={partyIndex}
            totalParties={numberOfParties}
            fieldIndex={fieldIndex}
            totalFields={repeatableFields.length}
            isLastField={isLastField}
            isLastParty={isLastParty}
          />
        );
      }
    }
  }

  // Show location and date question
  if (currentQuestionIndex === -3) {
    console.log('[DEBUG] Showing LocationDateQuestion');
    return <LocationDateQuestion />;
  }

  // Calculate template question index
  const templateQuestionIndex = currentQuestionIndex + 1000 - numberOfParties;
  
  console.log('[DEBUG] QuestionnaireForm render:', {
    currentQuestionIndex,
    templateQuestionIndex,
    visibleFieldsLength: visibleFields.length,
    repeatableFieldsLength: repeatableFields.length,
    numberOfParties,
    shouldShowQuestion: templateQuestionIndex >= 0 && templateQuestionIndex < visibleFields.length,
    shouldShowSummary: templateQuestionIndex === visibleFields.length
  });

  // Show template questions (after parties are done)
  if (templateQuestionIndex >= 0 && templateQuestionIndex < visibleFields.length) {
    console.log('[DEBUG] Showing QuestionnaireQuestion');
    return <QuestionnaireQuestion />;
  }

  // Show summary screen
  if (templateQuestionIndex === visibleFields.length) {
    console.log('[DEBUG] Showing QuestionnaireSummary');
    return <QuestionnaireSummary />;
  }

  console.warn('[DEBUG] No component matched! Returning null', {
    currentQuestionIndex,
    templateQuestionIndex,
    visibleFieldsLength: visibleFields.length
  });

  return null;
};

export default QuestionnaireForm;
