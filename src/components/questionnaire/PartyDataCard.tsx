import React, { useRef, useEffect, useState } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, User, HelpCircle, Building2, UserCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PartyData } from '../../types/template';
import { formatCPF, formatCNPJ, getDocumentMaxLength, getDocumentPlaceholder } from '@/utils/formatters';

interface PartyDataCardProps {
  partyIndex: number;
  partyData: PartyData;
  isLastParty: boolean;
  category?: 'main' | 'other';
  title?: string;
}

const PartyDataCard = ({ partyIndex, partyData, isLastParty, category = 'main', title }: PartyDataCardProps) => {
  const { updatePartyData, nextQuestion, previousQuestion, partyTypes, addPartyType, isEditingFromSummary, saveAndReturnToSummary } = useContract();
  const { isAdmin } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');

  // Garantir retrocompatibilidade - se personType não existir, assume PF
  const personType = partyData.personType || 'PF';

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [partyIndex]);

  const handleNext = () => {
    if (canProceed()) {
      if (isEditingFromSummary) {
        saveAndReturnToSummary();
      } else {
        nextQuestion();
      }
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

  const updateField = (field: keyof PartyData, value: string | boolean) => {
    const updatedParty = { ...partyData, [field]: value };
    updatePartyData(partyIndex, updatedParty, category === 'other');
  };

  const handlePersonTypeChange = (newType: 'PF' | 'PJ') => {
    // Ao mudar o tipo de pessoa, limpar campos específicos
    const updatedParty = { 
      ...partyData, 
      personType: newType,
      // Limpar documento ao trocar tipo
      cpf: '',
      // Limpar campos PF se mudar para PJ
      ...(newType === 'PJ' && {
        nationality: '',
        maritalStatus: '',
        profession: '',
      }),
      // Limpar campos de representante se mudar para PF
      ...(newType === 'PF' && {
        hasRepresentative: false,
        representativeName: '',
        representativeRole: '',
        representativeCpf: '',
      }),
    };
    updatePartyData(partyIndex, updatedParty, category === 'other');
  };

  const canProceed = () => {
    // Campos base obrigatórios para PF e PJ
    const baseFields = 
      partyData.fullName.trim() !== '' &&
      partyData.cpf.trim() !== '' &&
      partyData.address.trim() !== '' &&
      partyData.city.trim() !== '' &&
      partyData.state.trim() !== '' &&
      partyData.partyType.trim() !== '';
    
    if (personType === 'PJ') {
      // PJ não precisa de nationality/maritalStatus
      if (partyData.hasRepresentative) {
        // Se tem representante, precisa preencher os dados dele
        return baseFields && 
          (partyData.representativeName?.trim() || '') !== '' &&
          (partyData.representativeRole?.trim() || '') !== '' &&
          (partyData.representativeCpf?.trim() || '') !== '';
      }
      return baseFields;
    }
    
    // PF precisa de nationality/maritalStatus
    return baseFields && 
      partyData.nationality.trim() !== '' &&
      partyData.maritalStatus.trim() !== '';
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = personType === 'PJ' ? formatCNPJ(value) : formatCPF(value);
    updateField('cpf', formatted);
  };

  const handleRepresentativeCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    updateField('representativeCpf', formatted);
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
        fullName: personType === 'PJ' 
          ? "Razão Social conforme contrato social ou CNPJ" 
          : "Nome completo conforme documento de identidade da parte principal",
        document: personType === 'PJ'
          ? "CNPJ necessário para identificação legal da empresa"
          : "CPF necessário para identificação legal da parte contratante",
        partyType: "Tipo de participação principal no contrato",
        address: personType === 'PJ'
          ? "Endereço da sede da empresa"
          : "Endereço residencial completo"
      };
    } else {
      return {
        fullName: personType === 'PJ'
          ? "Razão Social da empresa testemunha/fiadora"
          : "Nome completo da testemunha/fiador/avalista conforme documento",
        document: personType === 'PJ'
          ? "CNPJ necessário para validação legal do documento"
          : "CPF necessário para validação legal do documento",
        partyType: "Função desta parte no contrato (testemunha, fiador, etc.)",
        address: personType === 'PJ'
          ? "Endereço da sede da empresa"
          : "Endereço residencial completo"
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
              {personType === 'PJ' ? (
                <Building2 className="w-8 h-8 text-primary" />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
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
          {/* ✅ Seletor de Tipo de Pessoa (PF/PJ) */}
          <div className="flex justify-center gap-4 p-4 bg-muted/30 rounded-lg">
            <Button
              type="button"
              variant={personType === 'PF' ? 'default' : 'outline'}
              className="flex items-center gap-2 flex-1 max-w-[200px]"
              onClick={() => handlePersonTypeChange('PF')}
            >
              <User className="w-4 h-4" />
              Pessoa Física
            </Button>
            <Button
              type="button"
              variant={personType === 'PJ' ? 'default' : 'outline'}
              className="flex items-center gap-2 flex-1 max-w-[200px]"
              onClick={() => handlePersonTypeChange('PJ')}
            >
              <Building2 className="w-4 h-4" />
              Pessoa Jurídica
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome Completo / Razão Social */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                {personType === 'PJ' ? 'Razão Social' : 'Nome Completo'} *
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
                placeholder={personType === 'PJ' ? 'Ex: Empresa ABC Ltda' : 'Ex: João Silva Santos'}
                className="text-base font-bold"
              />
            </div>

            {/* Campos apenas para Pessoa Física */}
            {personType === 'PF' && (
              <>
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
                  <label className="text-sm font-medium">Profissão</label>
                  <Input
                    value={partyData.profession || ''}
                    onChange={(e) => updateField('profession', e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ex: Engenheiro Civil"
                    className="text-base"
                  />
                </div>
              </>
            )}

            {/* CPF ou CNPJ */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                {personType === 'PJ' ? 'CNPJ' : 'CPF'} *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{helpTexts.document}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Input
                value={partyData.cpf}
                onChange={handleDocumentChange}
                onKeyPress={handleKeyPress}
                placeholder={getDocumentPlaceholder(personType)}
                maxLength={getDocumentMaxLength(personType)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                value={partyData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={personType === 'PJ' ? 'Ex: contato@empresa.com' : 'Ex: joao@exemplo.com'}
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
                  {isAdmin && (
                    <SelectItem value="__add_new__" className="text-primary font-semibold">
                      + Adicionar novo tipo
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                {personType === 'PJ' ? 'Endereço da Sede' : 'Endereço Completo'} *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{helpTexts.address}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Input
                value={partyData.address}
                onChange={(e) => updateField('address', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={personType === 'PJ' ? 'Ex: Av. Paulista, 1000, Sala 1501, Bela Vista' : 'Ex: Rua das Flores, 123, Apt 45, Centro'}
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

          {/* ✅ Seção de Representante Legal (apenas para PJ) */}
          {personType === 'PJ' && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id={`representative-${partyIndex}`}
                  checked={partyData.hasRepresentative || false}
                  onCheckedChange={(checked) => updateField('hasRepresentative', checked === true)}
                />
                <Label 
                  htmlFor={`representative-${partyIndex}`} 
                  className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-primary" />
                  Adicionar Representante Legal
                </Label>
              </div>

              {partyData.hasRepresentative && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="md:col-span-2">
                    <Badge variant="outline" className="mb-3">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Dados do Representante Legal
                    </Badge>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Nome Completo do Representante *</label>
                    <Input
                      value={partyData.representativeName || ''}
                      onChange={(e) => updateField('representativeName', e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ex: Maria Santos Silva"
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cargo/Função *</label>
                    <Select 
                      value={partyData.representativeRole || ''} 
                      onValueChange={(value) => updateField('representativeRole', value)}
                    >
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sócio-Administrador">Sócio-Administrador</SelectItem>
                        <SelectItem value="Sócio">Sócio</SelectItem>
                        <SelectItem value="Diretor">Diretor</SelectItem>
                        <SelectItem value="Diretor Executivo">Diretor Executivo</SelectItem>
                        <SelectItem value="Presidente">Presidente</SelectItem>
                        <SelectItem value="Procurador">Procurador</SelectItem>
                        <SelectItem value="Representante Legal">Representante Legal</SelectItem>
                        <SelectItem value="Gerente">Gerente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">CPF do Representante *</label>
                    <Input
                      value={partyData.representativeCpf || ''}
                      onChange={handleRepresentativeCpfChange}
                      onKeyPress={handleKeyPress}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="text-base"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!canProceed() && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">
                {personType === 'PJ' && partyData.hasRepresentative
                  ? 'Preencha todos os campos obrigatórios, incluindo os dados do representante legal.'
                  : 'Todos os campos marcados com * são obrigatórios para continuar.'}
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
              {isEditingFromSummary 
                ? 'Salvar e Voltar ao Sumário'
                : (isLastParty 
                    ? (category === 'main' ? 'Continuar' : 'Finalizar dados das partes') 
                    : `Próxima ${category === 'main' ? 'parte' : 'pessoa'}`)
              }
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
