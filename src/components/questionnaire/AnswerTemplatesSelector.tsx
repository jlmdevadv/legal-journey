import React from 'react';
import { Button } from '@/components/ui/button';
import { AnswerTemplate } from '@/types/template';
import { FileText, Plus } from 'lucide-react';

interface AnswerTemplatesSelectorProps {
  templates: AnswerTemplate[];
  currentValue: string;
  mode?: 'replace' | 'append';
  onSelectTemplate: (value: string) => void;
}

const AnswerTemplatesSelector: React.FC<AnswerTemplatesSelectorProps> = ({
  templates,
  currentValue,
  mode = 'replace',
  onSelectTemplate
}) => {
  if (!templates || templates.length === 0) {
    return null;
  }

  const handleTemplateClick = (templateValue: string) => {
    if (mode === 'append' && currentValue.trim()) {
      // Modo APPEND: adicionar ao conteúdo existente
      const newValue = currentValue.trim() + '\n' + templateValue;
      onSelectTemplate(newValue);
      console.log('[ANSWER-TEMPLATE] Modo APPEND:', { 
        previous: currentValue.substring(0, 50), 
        added: templateValue.substring(0, 50) 
      });
    } else {
      // Modo REPLACE ou campo vazio
      onSelectTemplate(templateValue);
      console.log('[ANSWER-TEMPLATE] Modo REPLACE:', { 
        value: templateValue.substring(0, 50) 
      });
    }
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <FileText className="w-4 h-4" />
        <span>Sugestões de Resposta:</span>
        {mode === 'append' && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            Modo: Acumular
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {templates.map((template, index) => (
          <Button
            key={index}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleTemplateClick(template.value)}
            className="text-left hover:bg-primary/10 hover:border-primary/30 transition-colors"
          >
            {mode === 'append' && <Plus className="w-3 h-3 mr-1" />}
            {template.title}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {mode === 'append' 
          ? 'Clique nas sugestões para adicionar ao texto (você poderá editar depois)'
          : 'Clique em uma sugestão para preencher automaticamente o campo (você poderá editar depois)'
        }
      </p>
    </div>
  );
};

export default AnswerTemplatesSelector;
