import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useContract } from '@/contexts/ContractContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContractCard from '@/components/contracts/ContractCard';
import { FileText, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';

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

const MeusContratos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listUserContracts, loadContract, deleteContract } = useContract();
  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [filter, setFilter] = useState<'all' | 'draft' | 'completed'>('all');
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

  const filteredContracts = contracts.filter((contract) => {
    if (filter === 'all') return true;
    return contract.status === filter;
  });

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <FileText className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">Nenhum contrato encontrado</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {filter === 'all' 
          ? 'Você ainda não criou nenhum contrato. Comece agora mesmo!'
          : `Você não tem contratos ${filter === 'draft' ? 'em rascunho' : 'finalizados'}.`
        }
      </p>
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

        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              Todos ({contracts.length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Rascunhos ({contracts.filter(c => c.status === 'draft').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Finalizados ({contracts.filter(c => c.status === 'completed').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredContracts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onOpen={() => handleOpenContract(contract.id)}
                onDelete={() => handleDeleteContract(contract.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeusContratos;
