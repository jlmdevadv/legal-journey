import React, { useRef, useEffect } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, User, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PartyData } from '../../types/template';

interface PartyDataCardProps {
  partyIndex: number;
  partyData: PartyData;
  isLastParty: boolean;
}

const PartyDataCard = ({ partyIndex, partyData, isLastParty }: PartyDataCardProps) => {
  const { updatePartyData, nextQuestion, previousQuestion } = useContract();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [partyIndex]);

  const handleNext = () => {
    if (canProceed()) {
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    previousQuestion();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceed()) {
      handleNext();
    }
  };

  const updateField = (field: keyof PartyData, value: string) => {
    const updatedParty = { ...partyData, [field]: value };
    updatePartyData(partyIndex, updatedParty);
  };

  const canProceed = () => {
    return partyData.fullName.trim() !== '' && 
           partyData.nationality.trim() !== '' &&
           partyData.maritalStatus.trim() !== '' &&
           partyData.cpf.trim() !== '' &&
           partyData.address.trim() !== '' &&
           partyData.city.trim() !== '' &&
           partyData.state.trim() !== '' &&
           partyData.partyType.trim() !== '';
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    updateField('cpf', formatted);
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-primary mb-2">
            Dados da Parte {partyIndex + 1}
          </CardTitle>
          <p className="text-muted-foreground">
            Preencha os dados completos desta parte do contrato
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Nome Completo *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nome completo conforme documento de identidade</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Input
                ref={inputRef}
                value={partyData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: João Silva Santos"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nacionalidade *</label>
              <Input
                value={partyData.nationality}
                onChange={(e) => updateField('nationality', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: Brasileira"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado Civil *</label>
              <Select value={partyData.maritalStatus} onValueChange={(value) => updateField('maritalStatus', value)}>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                  <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                  <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                  <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                  <SelectItem value="União Estável">União Estável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                CPF *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Informe apenas os números, a formatação é automática</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Input
                value={partyData.cpf}
                onChange={handleCPFChange}
                onKeyPress={handleKeyPress}
                placeholder="000.000.000-00"
                maxLength={14}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Parte *</label>
              <Select value={partyData.partyType} onValueChange={(value) => updateField('partyType', value as PartyData['partyType'])}>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contratante">Contratante</SelectItem>
                  <SelectItem value="Anuente">Anuente</SelectItem>
                  <SelectItem value="Fiador">Fiador</SelectItem>
                  <SelectItem value="Avalista">Avalista</SelectItem>
                  <SelectItem value="Testemunha">Testemunha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Endereço Completo *</label>
              <Input
                value={partyData.address}
                onChange={(e) => updateField('address', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: Rua das Flores, 123, Apt 45, Centro"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade *</label>
              <Input
                value={partyData.city}
                onChange={(e) => updateField('city', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: São Paulo"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado *</label>
              <Input
                value={partyData.state}
                onChange={(e) => updateField('state', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: SP"
                className="text-base"
              />
            </div>
          </div>

          {!canProceed() && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">
                Todos os campos são obrigatórios para continuar.
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              {isLastParty ? 'Finalizar dados das partes' : 'Próxima parte'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartyDataCard;