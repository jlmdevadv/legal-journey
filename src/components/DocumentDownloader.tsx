
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileType, File, ChevronDown } from 'lucide-react';
import { downloadDocument } from '../utils/documentGenerators';
import { DocumentData, DocumentFormat } from '../types/document';
import { useToast } from '@/hooks/use-toast';

interface DocumentDownloaderProps {
  documentData: DocumentData;
  filename: string;
  elementId?: string;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const DocumentDownloader = ({
  documentData,
  filename,
  elementId = 'contract-preview',
  variant = 'outline',
  size = 'default',
  className = ''
}: DocumentDownloaderProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<DocumentFormat | null>(null);
  const { toast } = useToast();

  const handleDownload = async (format: DocumentFormat) => {
    setIsDownloading(true);
    setDownloadingFormat(format);

    try {
      await downloadDocument(format, documentData, filename, elementId);
      toast({
        title: 'Download concluído',
        description: `Documento baixado em formato ${format.toUpperCase()}`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Erro no download',
        description: 'Ocorreu um erro ao gerar o documento. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
      setDownloadingFormat(null);
    }
  };

  const getFormatIcon = (format: DocumentFormat) => {
    switch (format) {
      case 'txt':
        return <FileText className="w-4 h-4" />;
      case 'docx':
        return <FileType className="w-4 h-4" />;
      case 'pdf':
        return <File className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  const getFormatDescription = (format: DocumentFormat) => {
    switch (format) {
      case 'txt':
        return 'Texto simples';
      case 'docx':
        return 'Microsoft Word';
      case 'pdf':
        return 'Documento PDF';
      default:
        return '';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDownloading}
          className={`flex items-center gap-2 ${className}`}
        >
          <Download className="w-4 h-4" />
          {isDownloading ? `Gerando ${downloadingFormat?.toUpperCase()}...` : 'Baixar'}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleDownload('txt')}
          disabled={isDownloading}
          className="flex items-center gap-3 cursor-pointer"
        >
          {getFormatIcon('txt')}
          <div className="flex flex-col">
            <span className="font-medium">.TXT</span>
            <span className="text-xs text-gray-500">{getFormatDescription('txt')}</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleDownload('docx')}
          disabled={isDownloading}
          className="flex items-center gap-3 cursor-pointer"
        >
          {getFormatIcon('docx')}
          <div className="flex flex-col">
            <span className="font-medium">.DOCX</span>
            <span className="text-xs text-gray-500">{getFormatDescription('docx')}</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleDownload('pdf')}
          disabled={isDownloading}
          className="flex items-center gap-3 cursor-pointer"
        >
          {getFormatIcon('pdf')}
          <div className="flex flex-col">
            <span className="font-medium">.PDF</span>
            <span className="text-xs text-gray-500">{getFormatDescription('pdf')}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DocumentDownloader;
