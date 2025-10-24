import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useContract } from '@/contexts/ContractContext';
import { validateTemplateJSON, convertJSONToTemplate, getTemplateStats, TemplateImportJSON } from '@/utils/templateImporter';

interface TemplateImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TemplateImporter = ({ open, onOpenChange }: TemplateImporterProps) => {
  const [jsonContent, setJsonContent] = useState('');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { addCustomTemplate } = useContract();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Por favor, selecione um arquivo JSON válido');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonContent(content);
      validateJSON(content);
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo');
    };
    reader.readAsText(file);
  };

  const validateJSON = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      const result = validateTemplateJSON(parsed);
      setValidationResult(result);
      
      if (result.valid) {
        toast.success('JSON válido! Pronto para importar.');
      } else {
        toast.error('JSON contém erros. Verifique a lista de erros.');
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: ['JSON inválido: ' + (error as Error).message]
      });
      toast.error('Formato JSON inválido');
    }
  };

  const handleImport = async () => {
    if (!validationResult?.valid) {
      toast.error('Por favor, corrija os erros antes de importar');
      return;
    }

    setIsImporting(true);
    try {
      const parsed: TemplateImportJSON = JSON.parse(jsonContent);
      const template = convertJSONToTemplate(parsed);
      
      await addCustomTemplate(template);
      
      toast.success(`Template "${template.name}" importado com sucesso!`);
      
      // Reset e fechar
      setJsonContent('');
      setValidationResult(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao importar template:', error);
      toast.error('Erro ao importar template: ' + (error as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setJsonContent('');
    setValidationResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Importar Template via JSON
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo JSON para criar um template completo automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <label htmlFor="json-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <span className="block text-sm font-medium text-gray-900">
                    Clique para fazer upload de um arquivo JSON
                  </span>
                  <span className="block text-sm text-gray-500">
                    Arraste e solte ou clique para selecionar
                  </span>
                  <span className="block text-xs text-gray-400">
                    Formato: .json
                  </span>
                </div>
              </label>
              <input
                id="json-upload"
                type="file"
                accept=".json"
                className="sr-only"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* JSON Preview e Editor */}
          {jsonContent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Conteúdo do Arquivo</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => validateJSON(jsonContent)}
                  >
                    Validar JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <Textarea
                value={jsonContent}
                onChange={(e) => {
                  setJsonContent(e.target.value);
                  setValidationResult(null); // Reset validação ao editar
                }}
                className="min-h-[300px] font-mono text-xs"
                placeholder="Cole ou edite o JSON aqui..."
              />
            </div>
          )}

          {/* Validation Result */}
          {validationResult && (
            <Card className={validationResult.valid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${validationResult.valid ? 'text-green-700' : 'text-red-700'}`}>
                  {validationResult.valid ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      JSON Válido
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      Erros Encontrados
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {validationResult.valid ? (
                  <div className="space-y-3">
                    <p className="text-green-700 font-medium">Template pronto para importação!</p>
                    {(() => {
                      try {
                        const parsed: TemplateImportJSON = JSON.parse(jsonContent);
                        const stats = getTemplateStats(parsed);
                        return (
                          <div className="space-y-2 text-sm text-green-800">
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">📋 Nome:</span>
                              <span>{parsed.templateName}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">📝 Campos:</span>
                              <span>{stats.totalCards} cards detectados</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">🔗 Placeholders:</span>
                              <span>{stats.totalPlaceholders} encontrados</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">✅ Obrigatórios:</span>
                              <span>{stats.requiredFields} campos</span>
                            </p>
                            {stats.conditionalFields > 0 && (
                              <p className="flex items-center gap-2">
                                <span className="font-semibold">🔀 Condicionais:</span>
                                <span>{stats.conditionalFields} campos com lógica</span>
                              </p>
                            )}
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-700 font-medium mb-3">Por favor, corrija os seguintes erros:</p>
                    <ul className="list-disc list-inside text-red-700 space-y-1">
                      {validationResult.errors.map((error, i) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!validationResult?.valid || isImporting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isImporting ? 'Importando...' : 'Importar Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateImporter;
