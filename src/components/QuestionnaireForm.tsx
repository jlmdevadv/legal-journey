
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
import QuestionnaireInfoCard from './questionnaire/QuestionnaireInfoCard';
import { getVisibleFields } from '@/utils/conditionalLogic';
import { useContractPreviewScroll } from '@/hooks/useContractPreviewScroll';

const QuestionnaireForm = () => {
  const { 
    selectedTemplate, 
    currentQuestionIndex,
    currentPartyLoopIndex, // ✅ NOVO v3.0
    isQuestionnaireMode, 
    numberOfParties, 
    partiesData,
    numberOfOtherParties,
    otherPartiesData,
    formValues
  } = useContract();

  // ✅ NOVO v3.0: Calcular campos visíveis ordenados por display_order
  const allVisibleFields = useMemo(() => {
    if (!selectedTemplate) return [];
    
    const visible = getVisibleFields(selectedTemplate.fields, formValues);
    const sorted = [...visible].sort((a, b) => {
      const orderA = a.display_order ?? 999999;
      const orderB = b.display_order ?? 999999;
      return orderA - orderB;
    });
    
    return sorted;
  }, [selectedTemplate, formValues]);

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

  // ============ BLOCO 2: PERGUNTAS UNIFICADAS (0+) ============
  if (currentQuestionIndex >= 0 && currentQuestionIndex < 9998) {
    if (currentQuestionIndex >= allVisibleFields.length) {
      console.error('[DEBUG] ERROR: currentQuestionIndex out of bounds!', {
        currentQuestionIndex,
        allVisibleFieldsLength: allVisibleFields.length
      });
      return null;
    }
    
    const currentField = allVisibleFields[currentQuestionIndex];
    
    console.log('[DEBUG] BLOCO 2 - Rendering unified question:', {
      currentQuestionIndex,
      currentPartyLoopIndex,
      fieldId: currentField.id,
      fieldType: currentField.type,
      isRepeatable: currentField.repeatPerParty
    });
    
    // CASO 1: Card informativo
    if (currentField.type === 'info') {
      return (
        <QuestionnaireInfoCard
          field={currentField}
          questionIndex={currentQuestionIndex}
          totalQuestions={allVisibleFields.length}
        />
      );
    }
    
    // CASO 2: Campo repetível
    if (currentField.repeatPerParty === true) {
      const currentParty = partiesData[currentPartyLoopIndex];
      
      if (!currentParty) {
        console.error('[DEBUG] ERROR: No party data for index!', {
          currentPartyLoopIndex,
          partiesDataLength: partiesData.length
        });
        return null;
      }
      
      const isLastField = currentQuestionIndex === allVisibleFields.length - 1;
      const isLastParty = currentPartyLoopIndex === numberOfParties - 1;
      
      return (
        <RepeatableFieldCard
          field={currentField}
          partyId={currentParty.id}
          partyName={currentParty.fullName}
          partyIndex={currentPartyLoopIndex}
          totalParties={numberOfParties}
          fieldIndex={currentQuestionIndex}
          totalFields={allVisibleFields.length}
          isLastField={isLastField}
          isLastParty={isLastParty}
        />
      );
    }
    
    // CASO 3: Campo não repetível
    return <QuestionnaireQuestion />;
  }

  // ============ BLOCO 3: Location/Date (9998) ============
  if (currentQuestionIndex === 9998) {
    console.log('[DEBUG] BLOCO 3 - Showing LocationDateQuestion');
    return <LocationDateQuestion />;
  }

  // ============ BLOCO 4: SUMÁRIO (9999) ============
  if (currentQuestionIndex === 9999) {
    console.log('[DEBUG] BLOCO 4 - Showing QuestionnaireSummary');
    return <QuestionnaireSummary />;
  }

  // ============ ERRO: Índice não reconhecido ============
  console.error('[DEBUG] ERROR: Invalid currentQuestionIndex!', {
    currentQuestionIndex,
    allVisibleFieldsLength: allVisibleFields.length
  });

  return null;
};

export default QuestionnaireForm;
