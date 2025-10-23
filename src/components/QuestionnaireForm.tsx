
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
import { getVisibleFields } from '@/utils/conditionalLogic';

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
    return getVisibleFields(selectedTemplate.fields, formValues);
  }, [selectedTemplate, formValues]);

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

  // Show location and date question
  if (currentQuestionIndex === -3) {
    return <LocationDateQuestion />;
  }

  // Show template questions (after parties are done)
  const templateQuestionIndex = currentQuestionIndex + 1000 - numberOfParties;
  if (templateQuestionIndex >= 0 && templateQuestionIndex < visibleFields.length) {
    return <QuestionnaireQuestion />;
  }

  // Show summary screen
  if (templateQuestionIndex === visibleFields.length) {
    return <QuestionnaireSummary />;
  }

  return null;
};

export default QuestionnaireForm;
