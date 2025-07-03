
import React from 'react';
import { useContract } from '../contexts/ContractContext';
import QuestionnaireWelcome from './questionnaire/QuestionnaireWelcome';
import QuestionnaireQuestion from './questionnaire/QuestionnaireQuestion';
import QuestionnaireSummary from './questionnaire/QuestionnaireSummary';

const QuestionnaireForm = () => {
  const { selectedTemplate, currentQuestionIndex, isQuestionnaireMode } = useContract();

  if (!selectedTemplate) return null;

  // Show welcome screen
  if (currentQuestionIndex === -1) {
    return <QuestionnaireWelcome />;
  }

  // Show summary screen
  if (currentQuestionIndex === selectedTemplate.fields.length) {
    return <QuestionnaireSummary />;
  }

  // Show current question
  if (currentQuestionIndex >= 0 && currentQuestionIndex < selectedTemplate.fields.length) {
    return <QuestionnaireQuestion />;
  }

  return null;
};

export default QuestionnaireForm;
