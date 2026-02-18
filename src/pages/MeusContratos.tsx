import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useContract } from '@/contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ContractCard from '@/components/contracts/ContractCard';
import { FileText, Plus, Building2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface SavedContract {
  id: string;
  name: string;
  status: string;
  template_id: string | null;
  updated_at: string;
  organization_id?: string | null;
  contract_templates?: {
    name: string;
  } | null;
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  completed: 'Finalizado',
  archived: 'Arquivado',
  pending_review: 'Pendente de Revisão',
  approved: 'Aprovado',
  rejected: 'Reprovado',
};

const MeusContratos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listUserContracts, loadContract, deleteContract } = useContract();
  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setIsLoading(true);
    const data = await listUserContracts();
    setContracts(data);
    setIsLoading(false);
  };

  const handleOpenContract = async (contractId: string) => {
    const success = await loadContract(contractId);
    if (success) {
      navigate('/');
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    const success = await deleteContract(contractId);
    if (success) {
      await loadContracts();
    }
  };

  const myContracts = contracts.filter(c => !c.organization_id);
  const sharedContracts = contracts.filter(c => !!c.organization_id);

  const filteredMyContracts = myContracts.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <FileText className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">Nenhum contrato encontrado</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{message}</p>
      <Button onClick={() => navigate('/')}>
        <Plus className="w-4 h-4 mr-2" />
        Criar Novo Contrato
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus contratos em um só lugar
          </p>
        </div>

        {/* Meus Contratos (B2C) */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Contratos Próprios</h2>
          <Tabs value={filter} onValueChange={setFilter} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">
                Todos ({myContracts.length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Rascunhos ({myContracts.filter(c => c.status === 'draft').length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Finalizados ({myContracts.filter(c => c.status === 'completed').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredMyContracts.length === 0 ? (
            <EmptyState message="Você ainda não criou nenhum contrato próprio." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMyContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract as any}
                  onOpen={() => handleOpenContract(contract.id)}
                  onDelete={() => handleDeleteContract(contract.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Shared Contracts (B2B2C) */}
        {sharedContracts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Documentos Compartilhados</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sharedContracts.map((contract) => (
                <div key={contract.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate">{contract.name}</h3>
                    <Badge variant={
                      contract.status === 'approved' ? 'default' :
                      contract.status === 'rejected' ? 'destructive' :
                      contract.status === 'pending_review' ? 'secondary' : 'outline'
                    }>
                      {statusLabels[contract.status] || contract.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Template: {contract.contract_templates?.name || '-'}
                  </p>
                  {contract.status === 'draft' && (
                    <Button size="sm" onClick={() => handleOpenContract(contract.id)}>
                      Continuar Preenchimento
                    </Button>
                  )}
                  {contract.status === 'rejected' && (
                    <p className="text-sm text-destructive">Documento reprovado. Edite e reenvie.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeusContratos;
