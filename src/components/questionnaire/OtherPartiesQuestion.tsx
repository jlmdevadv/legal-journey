import React from 'react';
import { useContract } from '../../contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';

const OtherPartiesQuestion = () => {
  const { nextQuestion, previousQuestion } = useContract();

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
            Demais Partes
          </CardTitle>
          <p className="text-muted-foreground">
            Há outras partes envolvidas como testemunhas, fiadores ou avalistas?
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Demais partes incluem:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Testemunhas:</strong> Partes que testemunham o acordo</li>
              <li>• <strong>Fiadores:</strong> Partes que garantem o cumprimento</li>
              <li>• <strong>Avalistas:</strong> Partes que avalizam operações</li>
              <li>• <strong>Anuentes:</strong> Partes que concordam com o contrato</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => nextQuestion('withOtherParties')}
              size="lg"
              className="w-full"
            >
              Sim, há outras partes
            </Button>
            
            <Button 
              onClick={() => nextQuestion('noOtherParties')}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Não, apenas as partes principais
            </Button>
          </div>
          
          <div className="flex justify-start pt-4">
            <Button 
              variant="outline" 
              onClick={previousQuestion}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OtherPartiesQuestion;
