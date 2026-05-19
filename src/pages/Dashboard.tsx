import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import StatsBar from '@/components/dashboard/StatsBar';
import ContratosPropriosSection from '@/components/dashboard/sections/ContratosPropriosSection';
import MeusModelosSection from '@/components/dashboard/sections/MeusModelosSection';
import DocumentosRecebidosSection from '@/components/dashboard/sections/DocumentosRecebidosSection';
import DocumentosCompartilhadosSection from '@/components/dashboard/sections/DocumentosCompartilhadosSection';
import PartyRegistrySection from '@/components/dashboard/PartyRegistrySection';
import { useDashboardData } from '@/hooks/useDashboardData';

const Dashboard = () => {
  const { isMaster, organization } = useAuth();
  const {
    ownContracts,
    receivedDocs,
    templates,
    orgDocuments,
    stats,
    loading,
    reload,
  } = useDashboardData();

  const pageTitle = isMaster && organization ? organization.name : 'Meus Contratos';
  const pageSubtitle = isMaster ? 'Painel de gerenciamento' : 'Gerencie seus contratos e documentos';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  const pendingCount = orgDocuments.filter(d => d.status === 'pending_review').length;
  const approvedCount = orgDocuments.filter(d => d.status === 'approved').length;
  const rejectedCount = orgDocuments.filter(d => d.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-10 pt-2">
          <h1 className="font-serif text-3xl text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">{pageSubtitle}</p>
        </div>

        <StatsBar stats={stats} isMaster={isMaster} />

        <ContratosPropriosSection contracts={ownContracts} onReload={reload} />

        {isMaster && (
          <MeusModelosSection templates={templates} onReload={reload} />
        )}

        <DocumentosRecebidosSection docs={receivedDocs} />

        <PartyRegistrySection />

        {isMaster && (
          <DocumentosCompartilhadosSection
            documents={orgDocuments}
            pendingCount={pendingCount}
            approvedCount={approvedCount}
            rejectedCount={rejectedCount}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
