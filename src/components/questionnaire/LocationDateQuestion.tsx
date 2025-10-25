import React, { useState } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, MapPin, Calendar } from 'lucide-react';

const LocationDateQuestion = () => {
  const { locationData, updateLocationData, nextQuestion, previousQuestion } = useContract();
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SE', 'SP', 'TO'
  ];

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};
    
    if (!locationData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }
    
    if (!locationData.state) {
      newErrors.state = 'Estado é obrigatório';
    }
    
    if (!locationData.date) {
      newErrors.date = 'Data é obrigatória';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    nextQuestion();
  };

  const handleInputChange = (field: string, value: string) => {
    updateLocationData(field, value);
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };


  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-contractPrimary mb-2">
            Local e Data do Contrato
          </CardTitle>
          <p className="text-gray-600">
            Informe o local e a data em que o contrato está sendo firmado.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="city" className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Cidade *
              </Label>
              <Input
                id="city"
                type="text"
                value={locationData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Ex: São Paulo"
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <Label htmlFor="state" className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Estado *
              </Label>
              <Select 
                value={locationData.state} 
                onValueChange={(value) => handleInputChange('state', value)}
              >
                <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {brazilianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state}</p>
              )}
            </div>

            <div>
              <Label htmlFor="date" className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data *
              </Label>
              <Input
                id="date"
                type="date"
                value={locationData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>
          </div>

          <div className="flex justify-between gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={previousQuestion}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>
            <Button 
              onClick={validateAndProceed}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationDateQuestion;
