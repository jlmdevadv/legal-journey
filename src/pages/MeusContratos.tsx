import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useContract } from '@/contexts/ContractContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import ContractCard from '@/components/contracts/ContractCard';
import SharedContractCard from '@/components/contracts/SharedContractCard';
import { ContractEvent } from '@/types/document';
import { FileText, Plus, Building2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface SavedContract {
  id: string;
  name: string;
  status: string;
  template_id: string | null;
  updated_at: string;
  organization_id?: string | null;
  review_notes?: string | null;
  reviewed_at?: string | null;
  generated_document?: string | null;
  share_links?: { token: string } | null;
  contract_templates?: {
    name: string;
  } | null;
}

const MeusContratos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listUserContracts, loadContract, deleteContract } = useContract();
  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [sharedContractEvents, setSharedContractEvents] = useState<Map<string, ContractEvent[]>>(new Map());
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadEventsForSharedContracts = async (sharedIds: string[]) => {
    if (sharedIds.length === 0) return;
    setEventsLoading(true);
    const { data } = await supabase
      .from('contract_events')
      .select('*')
      .in('contract_id', sharedIds)
      .order('occurred_at', { ascending: true });

    if (data) {
      const map = new Map<string, ContractEvent[]>();
      for (const event of data as ContractEvent[]) {
        const existing = map.get(event.contract_id) ?? [];
        map.set(event.contract_id, [...existing, event]);
      }
      setSharedContractEvents(map);
    }
    setEventsLoading(false);
  };

  const loadContracts = async () => {
    setIsLoading(true);
    const data = await listUserContracts();
    setContracts(data);
    setIsLoading(false);

    const shared = data.filter((c: SavedContract) => !!c.organization_id);
    const sharedIds = shared.map((c: SavedContract) => c.id);
    await loadEventsForSharedContracts(sharedIds);
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
      <h3 className="font-serif text-xl text-foreground mb-2">Nenhum contrato encontrado</h3>
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

      <div className="container mx-auto py-8 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-foreground mb-2">Meus Contratos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todos os seus contratos em um só lugar
          </p>
        </div>

        {/* Meus Contratos (B2C) */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl text-foreground">Contratos Próprios</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 rounded border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Todos ({myContracts.length})</option>
              <option value="draft">Rascunhos ({myContracts.filter(c => c.status === 'draft').length})</option>
              <option value="completed">Finalizados ({myContracts.filter(c => c.status === 'completed').length})</option>
            </select>
          </div>

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
              <h2 className="font-serif text-xl text-foreground">Documentos Compartilhados</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sharedContracts.map((contract) => (
                <SharedContractCard
                  key={contract.id}
                  contract={contract as any}
                  events={sharedContractEvents.get(contract.id) ?? []}
                  eventsLoading={eventsLoading}
                  onOpen={() => handleOpenContract(contract.id)}
                  onNavigateToSharedLink={() =>
                    navigate(`/s/${contract.share_links!.token}`)
                  }
                  onDownload={(_contractId) => {
                    // Download acontece dentro do ContractPreviewModal via DocumentDownloader
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeusContratos;
