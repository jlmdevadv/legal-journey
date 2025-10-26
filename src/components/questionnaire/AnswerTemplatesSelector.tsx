import React from 'react';
import { Button } from '@/components/ui/button';
import { AnswerTemplate } from '@/types/template';
import { FileText } from 'lucide-react';

interface AnswerTemplatesSelectorProps {
  templates: AnswerTemplate[];
  onSelectTemplate: (value: string) => void;
}

const AnswerTemplatesSelector: React.FC<AnswerTemplatesSelectorProps> = ({
  templates,
  onSelectTemplate
}) => {
  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <FileText className="w-4 h-4" />
        <span>Sugestões de Resposta:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {templates.map((template, index) => (
          <Button
            key={index}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectTemplate(template.value)}
            className="text-left hover:bg-primary/10 hover:border-primary/30 transition-colors"
          >
            {template.title}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Clique em uma sugestão para preencher automaticamente o campo (você poderá editar depois)
      </p>
    </div>
  );
};

export default AnswerTemplatesSelector;
