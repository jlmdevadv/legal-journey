import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Link2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GenerateLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
}

const GenerateLinkModal = ({ open, onOpenChange, templateId, templateName }: GenerateLinkModalProps) => {
  const { user, organization } = useAuth();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!user || !organization) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase
        .from('share_links')
        .insert({
          template_id: templateId,
          organization_id: organization.id,
          created_by_user_id: user.id,
        })
        .select('token')
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/s/${data.token}`;
      setGeneratedLink(url);
      toast.success('Link gerado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao gerar link: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setGeneratedLink(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Gerar Link de Preenchimento
          </DialogTitle>
          <DialogDescription>
            Gere um link para que terceiros preencham o modelo "{templateName}". O link expira em 10 dias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!generatedLink ? (
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Gerar Link
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <Label>Link gerado:</Label>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe este link com a pessoa que deve preencher o contrato.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateLinkModal;
