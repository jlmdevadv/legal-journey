import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavedContract {
  id: string;
  name: string;
  status: 'draft' | 'completed' | 'archived';
  template_id: string | null;
  updated_at: string;
  contract_templates?: {
    name: string;
  } | null;
}

interface ContractCardProps {
  contract: SavedContract;
  onOpen: () => void;
  onDelete: () => void;
  onDownload?: () => void;
}

const ContractCard = ({ contract, onOpen, onDelete, onDownload }: ContractCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'completed':
        return 'Finalizado';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate">{contract.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <FileText className="w-3 h-3" />
                <span className="truncate">
                  Template: {contract.contract_templates?.name || 'Template não encontrado'}
                </span>
              </CardDescription>
            </div>
            <Badge variant={getStatusVariant(contract.status)}>
              {getStatusLabel(contract.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Última modificação: {formatDate(contract.updated_at)}
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={onOpen} className="flex-1">
            {contract.status === 'draft' ? 'Continuar Preenchimento' : 'Visualizar'}
          </Button>
          {contract.status === 'completed' && onDownload && (
            <Button variant="outline" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowDeleteDialog(true)}>
            <Trash className="w-4 h-4 text-destructive" />
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contrato "{contract.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContractCard;
