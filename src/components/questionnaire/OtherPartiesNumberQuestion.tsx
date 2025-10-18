import React, { useState } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';

const OtherPartiesNumberQuestion = () => {
  const { nextQuestion, previousQuestion, setNumberOfOtherParties } = useContract();
  const [numberOfOtherParties, setLocalNumberOfOtherParties] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleNext = () => {
    const num = parseInt(numberOfOtherParties);
    if (!numberOfOtherParties || isNaN(num) || num < 1) {
      setError('Por favor, informe um número válido de partes (mínimo 1)');
      return;
    }
    
    if (num > 10) {
      setError('Máximo de 10 outras partes permitidas');
      return;
    }

    setError('');
    setNumberOfOtherParties(num);
    nextQuestion();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-primary mb-2">
            Quantas outras partes?
          </CardTitle>
          <p className="text-muted-foreground">
            Informe o número de testemunhas, fiadores, avalistas e anuentes
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Número de outras partes *
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={numberOfOtherParties}
                onChange={(e) => setLocalNumberOfOtherParties(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: 2"
                className="text-lg text-center"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Outras partes podem ser:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Testemunhas:</strong> Presenciam a assinatura</li>
                <li>• <strong>Fiadores:</strong> Garantem obrigações</li>
                <li>• <strong>Avalistas:</strong> Garantem títulos</li>
                <li>• <strong>Anuentes:</strong> Concordam com o contrato</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={previousQuestion}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            <Button 
              onClick={handleNext}
              className="flex items-center gap-2"
              disabled={!numberOfOtherParties || parseInt(numberOfOtherParties) < 1}
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OtherPartiesNumberQuestion;
