import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileJson, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import mammoth from 'mammoth';

interface ContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (content: string) => void;
}

const IMPORT_WARNING = 'Não é necessário incluir no texto: qualificação de partes, data e campo de assinatura. Esses elementos são configurados separadamente. Se incluídos, precisarão ser removidos manualmente.';

const ContentModal = ({ open, onOpenChange, onConfirm }: ContentModalProps) => {
  const [pastedText, setPastedText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState('paste');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.name.endsWith('.txt')) {
      const text = await file.text();
      setFileContent(text);
    } else if (file.name.endsWith('.docx')) {
      const buffer = await file.arrayBuffer();
      try {
        const result = await mammoth.extractRawValue({ arrayBuffer: buffer });
        setFileContent(result.value);
      } catch {
        toast.error('Erro ao ler arquivo .docx. Verifique se o arquivo não está corrompido.');
      }
    } else {
      toast.error('Formato não suportado. Use .txt ou .docx');
    }

    // reset input so same file can be selected again
    e.target.value = '';
  };

  const extractJsonContent = (raw: string): string => {
    try {
      const parsed = JSON.parse(raw);
      // Accept any string field that looks like document content
      return parsed.template ?? parsed.content ?? parsed.text ?? raw;
    } catch {
      return raw;
    }
  };

  const handleConfirm = () => {
    let content = '';
    if (activeTab === 'paste') content = pastedText.trim();
    else if (activeTab === 'json') content = extractJsonContent(jsonText.trim());
    else if (activeTab === 'file') content = fileContent.trim();

    if (!content) {
      toast.error('Insira ou importe o conteúdo do documento antes de continuar.');
      return;
    }

    onConfirm(content);
    setPastedText('');
    setJsonText('');
    setFileContent('');
    setFileName('');
    setActiveTab('paste');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Modelo</DialogTitle>
          <DialogDescription>
            Insira o conteúdo do documento. A configuração de partes e campos será feita nas próximas etapas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm mb-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{IMPORT_WARNING}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="paste" className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Colar texto
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              <FileJson className="w-4 h-4 mr-2" />
              Importar JSON
            </TabsTrigger>
            <TabsTrigger value="file" className="flex-1">
              <Upload className="w-4 h-4 mr-2" />
              Upload de arquivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-4">
            <Textarea
              placeholder="Cole aqui o texto do contrato..."
              className="min-h-[280px] font-mono text-sm"
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="json" className="mt-4">
            <Textarea
              placeholder="Cole aqui o JSON do template..."
              className="min-h-[280px] font-mono text-sm"
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="file" className="mt-4">
            <label
              htmlFor="content-file-upload"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-lg p-10 cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="w-10 h-10 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {fileName ? fileName : 'Clique para selecionar .txt ou .docx'}
              </span>
            </label>
            <input
              id="content-file-upload"
              type="file"
              accept=".txt,.docx"
              className="sr-only"
              onChange={handleFileUpload}
            />
            {fileContent && (
              <p className="mt-2 text-xs text-muted-foreground">
                {fileContent.length} caracteres extraídos.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Continuar →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentModal;
