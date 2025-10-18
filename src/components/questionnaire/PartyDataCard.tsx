import React, { useRef, useEffect, useState } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, User, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { PartyData } from '../../types/template';

interface PartyDataCardProps {
  partyIndex: number;
  partyData: PartyData;
  isLastParty: boolean;
  category?: 'main' | 'other';
  title?: string;
}

const PartyDataCard = ({ partyIndex, partyData, isLastParty, category = 'main', title }: PartyDataCardProps) => {
  const { updatePartyData, nextQuestion, previousQuestion, partyTypes, isAdminMode, addPartyType } = useContract();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');

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
    updatePartyData(partyIndex, updatedParty, category === 'other');
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

  const handleAddNewType = async () => {
    if (newTypeName.trim()) {
      await addPartyType({
        name: newTypeName.trim(),
        category: category,
        description: newTypeDescription.trim()
      });
      updateField('partyType', newTypeName.trim());
      setShowAddTypeModal(false);
      setNewTypeName('');
      setNewTypeDescription('');
    }
  };

  // Filter types by category
  const relevantTypes = partyTypes.filter((t: any) => t.category === category);

  const getHelpText = () => {
    if (category === 'main') {
      return {
        fullName: "Nome completo conforme documento de identidade da parte principal",
        cpf: "CPF necessário para identificação legal da parte contratante",
        partyType: "Tipo de participação principal no contrato"
      };
    } else {
      return {
        fullName: "Nome completo da testemunha/fiador/avalista conforme documento",
        cpf: "CPF necessário para validação legal do documento",
        partyType: "Função desta parte no contrato (testemunha, fiador, etc.)"
      };
    }
  };

  const helpTexts = getHelpText();

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CardTitle className="text-2xl text-primary">
              {title || `Dados da Parte ${partyIndex + 1}`}
            </CardTitle>
            <Badge variant={category === 'main' ? 'default' : 'secondary'}>
              {category === 'main' ? 'Parte Principal' : 'Demais Partes'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {category === 'main' 
              ? 'Preencha os dados completos desta parte principal do contrato'
              : 'Preencha os dados completos desta testemunha/fiador/avalista'}
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
                      <p>{helpTexts.fullName}</p>
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
                className="text-base font-bold"
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
                      <p>{helpTexts.cpf}</p>
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
              <label className="text-sm font-medium flex items-center gap-2">
                Tipo de Parte *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{helpTexts.partyType}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Select 
                value={partyData.partyType} 
                onValueChange={(value) => {
                  if (value === '__add_new__') {
                    setShowAddTypeModal(true);
                  } else {
                    updateField('partyType', value);
                  }
                }}
              >
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {relevantTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                  {isAdminMode && (
                    <SelectItem value="__add_new__" className="text-primary font-semibold">
                      + Adicionar novo tipo
                    </SelectItem>
                  )}
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
              {isLastParty ? (category === 'main' ? 'Continuar' : 'Finalizar dados das partes') : `Próxima ${category === 'main' ? 'parte' : 'pessoa'}`}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal para adicionar novo tipo */}
      <Dialog open={showAddTypeModal} onOpenChange={setShowAddTypeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Tipo de Parte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do tipo *</label>
              <Input
                placeholder="Ex: Procurador, Curador, Representante Legal"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                placeholder="Ex: Representa legalmente a parte"
                value={newTypeDescription}
                onChange={(e) => setNewTypeDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowAddTypeModal(false);
                setNewTypeName('');
                setNewTypeDescription('');
              }}>
                Cancelar
              </Button>
              <Button onClick={handleAddNewType} disabled={!newTypeName.trim()}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartyDataCard;