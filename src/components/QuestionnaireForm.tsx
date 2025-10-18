
import React from 'react';
import { useContract } from '../contexts/ContractContext';
import QuestionnaireWelcome from './questionnaire/QuestionnaireWelcome';
import QuestionnaireQuestion from './questionnaire/QuestionnaireQuestion';
import QuestionnaireSummary from './questionnaire/QuestionnaireSummary';
import PartyNumberQuestion from './questionnaire/PartyNumberQuestion';
import PartyDataCard from './questionnaire/PartyDataCard';
import LocationDateQuestion from './questionnaire/LocationDateQuestion';

const QuestionnaireForm = () => {
  const { 
    selectedTemplate, 
    currentQuestionIndex, 
    isQuestionnaireMode, 
    numberOfParties, 
    partiesData 
  } = useContract();

  if (!selectedTemplate) return null;

  // Show welcome screen
  if (currentQuestionIndex === -1) {
    return <QuestionnaireWelcome />;
  }

  // Show party number question
  if (currentQuestionIndex === -2) {
    return <PartyNumberQuestion />;
  }

  // Show party data cards (indices -1000 to -1000 + numberOfParties - 1)
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
  if (templateQuestionIndex >= 0 && templateQuestionIndex < selectedTemplate.fields.length) {
    return <QuestionnaireQuestion />;
  }

  // Show summary screen
  if (templateQuestionIndex === selectedTemplate.fields.length) {
    return <QuestionnaireSummary />;
  }

  return null;
};

export default QuestionnaireForm;
