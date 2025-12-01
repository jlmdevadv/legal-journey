import React, { useState, useEffect } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, Edit, Printer, AlertCircle, Save } from 'lucide-react';
import DocumentDownloader from '../DocumentDownloader';
import ContractPreviewModal from '../ContractPreviewModal';
import { getRepeatableVisibleFields, getNonRepeatableVisibleFields, getVisibleFields } from '@/utils/conditionalLogic';
import { validateAllVisibleRequiredFields, ValidationResult } from '@/utils/validation';

const QuestionnaireSummary = () => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSavingManually, setIsSavingManually] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: false,
    invalidFieldIds: new Set(),
    invalidRepeatableFields: new Map()
  });
  const { user } = useAuth();
  const { 
    selectedTemplate, 
    formValues, 
    previousQuestion, 
    goToQuestion, 
    finishQuestionnaire,
    fillContractTemplate,
    generateFinalDocument,
    getContractingParties,
    getOtherInvolved,
    getSignatures,
    locationData,
    getLocationDate,
    partiesData,
    otherPartiesData,
    repeatableFieldsData,
    numberOfParties,
    saveContract
  } = useContract();

  if (!selectedTemplate) return null;

  // Executar validação sempre que formValues, repeatableFieldsData ou template mudarem
  useEffect(() => {
    if (!selectedTemplate) return;
    
    const result = validateAllVisibleRequiredFields(
      selectedTemplate.fields,
      formValues,
      partiesData,
      repeatableFieldsData
    );
    
    setValidationResult(result);
  }, [selectedTemplate, formValues, partiesData, repeatableFieldsData]);

  // Verificar se campo está inválido
  const isFieldInvalid = (fieldId: string, partyId?: string): boolean => {
    if (partyId) {
      // Campo repetível
      return validationResult.invalidRepeatableFields.get(fieldId)?.has(partyId) || false;
    } else {
      // Campo não-repetível
      return validationResult.invalidFieldIds.has(fieldId);
    }
  };

  const handlePrint = () => {
    finishQuestionnaire();
    setTimeout(() => window.print(), 100);
  };

  const getDocumentData = () => ({
    title: selectedTemplate.name,
    content: generateFinalDocument(), // Usar generateFinalDocument para download
    parties: getContractingParties(),
    otherInvolved: getOtherInvolved(),
    signatures: getSignatures(),
    locationDate: getLocationDate()
  });

  const navigateToRepeatableField = (fieldId: string, partyId: string) => {
    // ✅ NOVO v3.0: Usar getAllVisibleFieldsSorted para encontrar índice global
    const allFields = selectedTemplate?.fields ? 
      (() => {
        const visible = getVisibleFields(selectedTemplate.fields, formValues);
        return [...visible].sort((a, b) => {
          const orderA = a.display_order ?? 999999;
          const orderB = b.display_order ?? 999999;
          return orderA - orderB;
        });
      })() : [];
    
    const globalIndex = allFields.findIndex(f => f.id === fieldId);
    const partyIndex = partiesData.findIndex(p => p.id === partyId);
    
    if (globalIndex >= 0 && partyIndex >= 0) {
      console.log('[DEBUG] Navigating to repeatable field (BLOCO 2 v3.0):', { 
        fieldId, 
        partyId, 
        partyIndex, 
        globalIndex
      });
      goToQuestion(globalIndex, true);
    }
  };

  const handleManualSave = async () => {
    if (!user) return;
    
    setIsSavingManually(true);
    try {
      await saveContract(undefined, true); // showToast = true
    } finally {
      setIsSavingManually(false);
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-contractPrimary mb-2">
            Questionário Concluído!
          </CardTitle>
          <p className="text-gray-600">
            Revise suas respostas abaixo. Você pode editar qualquer informação antes de finalizar.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Partes Principais */}
          {partiesData.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-primary">Partes Principais</h4>
                <Badge variant="default">{partiesData.length}</Badge>
              </div>
              <div className="space-y-2">
                {partiesData.map((party, index) => (
                  <div key={party.id} className="bg-background p-3 rounded border text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold">{party.fullName}</p>
                        <p className="text-muted-foreground">
                          <span className="font-medium">{party.partyType}</span> • {party.cpf}
                          {party.profession && ` • ${party.profession}`}
                          {party.email && ` • ${party.email}`}
                          {` • ${party.city}/${party.state}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => goToQuestion(-1000 + index, true)}
                        className="text-primary hover:text-primary/80 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demais Partes */}
          {otherPartiesData.length > 0 && (
            <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-secondary-foreground">Demais Partes</h4>
                <Badge variant="secondary">{otherPartiesData.length}</Badge>
              </div>
              <div className="space-y-2">
                {otherPartiesData.map((party, index) => (
                  <div key={party.id} className="bg-background p-3 rounded border text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold">{party.fullName}</p>
                        <p className="text-muted-foreground">
                          <span className="font-medium">{party.partyType}</span> • {party.cpf}
                          {party.profession && ` • ${party.profession}`}
                          {party.email && ` • ${party.email}`}
                          {` • ${party.city}/${party.state}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => goToQuestion(-2000 + index, true)}
                        className="text-secondary-foreground hover:text-secondary-foreground/80 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location and Date Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-900">Local e Data do Contrato</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToQuestion(9998, true)}
                className="text-gray-600 hover:text-gray-700 p-1"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cidade:</span>
                <span className="font-medium">{locationData.city || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-medium">{locationData.state || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data:</span>
                <span className="font-medium">
                  {locationData.date ? new Date(locationData.date).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Campos Repetíveis por Parte */}
          {(() => {
            const repeatableFields = getRepeatableVisibleFields(selectedTemplate.fields, formValues);
            if (repeatableFields.length > 0) {
              return (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3">Informações por Parte Principal</h4>
                  <div className="space-y-4">
                    {repeatableFields.map((field) => {
                      const fieldData = repeatableFieldsData.find(f => f.fieldId === field.id);
                      return (
                        <div key={field.id} className="border border-purple-200 rounded-lg p-3 bg-white">
                          <h5 className="font-medium text-purple-900 mb-2">{field.label}</h5>
                          {fieldData?.responses && fieldData.responses.length > 0 ? (
                            <div className="space-y-2">
                              {fieldData.responses.map((response, idx) => (
                                <div 
                                  key={response.partyId} 
                                  className={`text-sm p-2 rounded flex justify-between items-center ${
                                    isFieldInvalid(field.id, response.partyId) 
                                      ? 'bg-red-50 border-2 border-red-400' 
                                      : 'bg-purple-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isFieldInvalid(field.id, response.partyId) && (
                                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    )}
                                    <div>
                                      <span className="font-medium text-purple-800">{response.partyName}:</span>{' '}
                                      <span className={isFieldInvalid(field.id, response.partyId) ? 'text-red-600 font-medium' : 'text-gray-700'}>
                                        {response.value || <span className="text-red-500 italic font-medium">⚠️ Campo obrigatório não preenchido</span>}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigateToRepeatableField(field.id, response.partyId)}
                                    className={isFieldInvalid(field.id, response.partyId) ? 'text-red-600 hover:text-red-700 p-1' : 'text-purple-600 hover:text-purple-700 p-1'}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Nenhuma resposta registrada</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Campos Não-Repetíveis */}
          {(() => {
            const nonRepeatableFields = getNonRepeatableVisibleFields(selectedTemplate.fields, formValues);
            
            // ✅ NOVO v3.0: Função helper para encontrar índice global
            const findGlobalIndex = (fieldId: string): number => {
              const allFields = (() => {
                const visible = getVisibleFields(selectedTemplate.fields, formValues);
                return [...visible].sort((a, b) => {
                  const orderA = a.display_order ?? 999999;
                  const orderB = b.display_order ?? 999999;
                  return orderA - orderB;
                });
              })();
              return allFields.findIndex(f => f.id === fieldId);
            };
            
            if (nonRepeatableFields.length > 0) {
              return (
                <div className="grid gap-4">
                  <h4 className="font-semibold text-gray-900">Informações Gerais do Contrato</h4>
                  {nonRepeatableFields.map((field) => (
                    <div 
                      key={field.id} 
                      className={`border rounded-lg p-4 ${
                        isFieldInvalid(field.id) 
                          ? 'border-red-400 border-2 bg-red-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {isFieldInvalid(field.id) && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          <h4 className="font-medium text-gray-900">{field.label}</h4>
                          {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => goToQuestion(findGlobalIndex(field.id), true)}
                          className={isFieldInvalid(field.id) ? 'text-red-600 hover:text-red-700 p-1' : 'text-blue-600 hover:text-blue-700 p-1'}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className={`p-2 rounded ${isFieldInvalid(field.id) ? 'bg-white text-red-600 font-medium' : 'bg-gray-50 text-gray-700'}`}>
                        {formValues[field.id] || <span className="text-red-500 italic">⚠️ Campo obrigatório não preenchido</span>}
                      </p>
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          })()}
          
          {/* Alerta de Validação */}
          {!validationResult.isValid && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <strong>Atenção!</strong> Existem campos obrigatórios não preenchidos (destacados em vermelho acima). 
                Por favor, preencha todos os campos marcados antes de visualizar ou baixar o contrato.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Próximos passos</h3>
            <p className="text-sm text-blue-700 mb-3">
              {validationResult.isValid 
                ? 'Seu contrato está pronto! Você pode visualizá-lo, imprimi-lo ou baixá-lo.'
                : 'Complete os campos obrigatórios destacados acima para prosseguir.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setShowPreviewModal(true)}
                variant="outline"
                disabled={!validationResult.isValid}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Visualizar Contrato
              </Button>
              <Button 
                onClick={handlePrint}
                disabled={!validationResult.isValid}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
              <DocumentDownloader
                documentData={getDocumentData()}
                filename={selectedTemplate.name}
                elementId="contract-preview"
                variant="outline"
                disabled={!validationResult.isValid}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {user && (
                <Button
                  onClick={handleManualSave}
                  disabled={isSavingManually}
                  variant="outline"
                  className="border-green-200 text-green-600 hover:bg-green-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSavingManually ? 'Salvando...' : 'Salvar Contrato'}
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex justify-start">
            <Button 
              variant="outline" 
              onClick={previousQuestion}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar à última pergunta
            </Button>
          </div>
        </CardContent>
      </Card>

      <ContractPreviewModal 
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </div>
  );
};

export default QuestionnaireSummary;
