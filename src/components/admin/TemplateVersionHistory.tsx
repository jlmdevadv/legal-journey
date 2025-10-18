import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Eye, RotateCcw } from 'lucide-react';
import { ContractTemplate } from '@/types/template';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TemplateVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ContractTemplate;
  onRestore: (version: string) => void;
  onPreview: (version: string) => void;
}

const TemplateVersionHistory = ({
  open,
  onOpenChange,
  template,
  onRestore,
  onPreview
}: TemplateVersionHistoryProps) => {
  const currentVersion = template.version?.version || "1.0";
  const history = template.version?.history || [];

  const formatVersionDate = (dateString: string) => {
    try {
      return format(
        new Date(dateString),
        "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
        { locale: ptBR }
      );
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Versões - {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Versão Atual */}
          <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg text-green-700">
                  Versão {currentVersion} (Atual)
                </div>
                <div className="text-sm text-gray-600">
                  {template.updated_at && formatVersionDate(template.updated_at)}
                </div>
              </div>
              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">
                Em uso
              </span>
            </div>
          </div>

          {/* Versões Anteriores */}
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma versão anterior disponível</p>
              <p className="text-sm mt-2">
                Histórico mantém apenas as 2 últimas versões
              </p>
            </div>
          ) : (
            history.map((versionData: any) => (
              <div
                key={versionData.version}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">
                      Versão {versionData.version}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatVersionDate(versionData.date)}
                    </div>
                    <div className="text-sm mt-2 p-2 bg-gray-100 rounded">
                      <strong>Alterações:</strong> {versionData.changes}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPreview(versionData.version)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(
                          `Tem certeza que deseja restaurar a versão ${versionData.version}? Isso criará uma nova versão com o conteúdo antigo.`
                        )) {
                          onRestore(versionData.version);
                        }
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restaurar
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateVersionHistory;
