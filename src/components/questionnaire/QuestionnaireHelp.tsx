
import React, { useState } from 'react';
import { ContractField } from '../../data/contractTemplates';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HelpCircle, Info, PlayCircle, ChevronDown } from 'lucide-react';

interface QuestionnaireHelpProps {
  field: ContractField;
}

const QuestionnaireHelp = ({ field }: QuestionnaireHelpProps) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(section)) {
      newOpenSections.delete(section);
    } else {
      newOpenSections.add(section);
    }
    setOpenSections(newOpenSections);
  };

  const hasAnyHelp = field.howToFill || field.whyImportant || field.videoLink;

  if (!hasAnyHelp) {
    return null;
  }

  return (
    <div className="space-y-2">
      {field.howToFill && (
        <Collapsible open={openSections.has('howToFill')} onOpenChange={() => toggleSection('howToFill')}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-left p-3 h-auto text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>Como devo preencher essa cláusula?</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${openSections.has('howToFill') ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-3">
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">{field.howToFill}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {field.whyImportant && (
        <Collapsible open={openSections.has('whyImportant')} onOpenChange={() => toggleSection('whyImportant')}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-left p-3 h-auto text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>Por que devo preencher esse campo?</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${openSections.has('whyImportant') ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-3">
            <div className="bg-amber-50 p-3 rounded-md">
              <p className="text-sm text-amber-800">{field.whyImportant}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {field.videoLink && (
        <Collapsible open={openSections.has('videoLink')} onOpenChange={() => toggleSection('videoLink')}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-left p-3 h-auto text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                <span>Ver vídeo explicativo</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${openSections.has('videoLink') ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3 pb-3">
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm text-green-800 mb-2">
                Assista ao vídeo explicativo para uma explicação mais detalhada:
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-green-700 border-green-300 hover:bg-green-100"
                onClick={() => window.open(field.videoLink, '_blank')}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Assistir vídeo
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default QuestionnaireHelp;
