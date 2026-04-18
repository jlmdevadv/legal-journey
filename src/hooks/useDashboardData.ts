import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContract } from '@/contexts/ContractContext';
import { supabase } from '@/integrations/supabase/client';
import { ContractTemplate } from '@/types/template';

export interface DashboardContract {
  id: string;
  name: string;
  status: string;
  template_id: string | null;
  updated_at: string;
  organization_id: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  generated_document: string | null;
  share_links: { token: string } | null;
  contract_templates: { name: string } | null;
}

export interface OrgDocument {
  id: string;
  name: string;
  status: string;
  submitted_for_review_at: string | null;
  updated_at: string;
  user_id: string;
}

export interface DashboardStats {
  templates: { count: number; limit: number };
  pending: number;
  finalized: number;
}

export interface DashboardData {
  ownContracts: DashboardContract[];
  receivedDocs: DashboardContract[];
  templates: ContractTemplate[];
  orgDocuments: OrgDocument[];
  stats: DashboardStats;
  loading: boolean;
  reload: () => void;
}

export function useDashboardData(): DashboardData {
  const { organization, isMaster } = useAuth();
  const { listUserContracts } = useContract();

  const [ownContracts, setOwnContracts] = useState<DashboardContract[]>([]);
  const [receivedDocs, setReceivedDocs] = useState<DashboardContract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [orgDocuments, setOrgDocuments] = useState<OrgDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const allContracts = (await listUserContracts()) as DashboardContract[];
    setOwnContracts(allContracts.filter(c => !c.organization_id));
    setReceivedDocs(allContracts.filter(c => !!c.organization_id));

    if (isMaster && organization) {
      const [tplRes, docsRes] = await Promise.all([
        supabase
          .from('contract_templates')
          .select('*')
          .eq('organization_id', organization.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('saved_contracts')
          .select('id, name, status, submitted_for_review_at, updated_at, user_id')
          .eq('organization_id', organization.id)
          .order('updated_at', { ascending: false }),
      ]);

      if (tplRes.data) {
        const mapped: ContractTemplate[] = tplRes.data.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          template: t.template,
          fields: Array.isArray(t.fields) ? (t.fields as any[]) : [],
          usePartySystem: t.use_party_system ?? true,
          version: t.version as any,
          organization_id: t.organization_id,
        }));
        setTemplates(mapped);
      }

      if (docsRes.data) {
        setOrgDocuments(docsRes.data as OrgDocument[]);
      }
    }

    setLoading(false);
  }, [isMaster, organization, listUserContracts]);

  useEffect(() => { load(); }, [load]);

  const pending = isMaster
    ? orgDocuments.filter(d => d.status === 'pending_review').length
    : receivedDocs.filter(d => d.status === 'draft' || d.status === 'rejected').length;

  const finalized = isMaster
    ? orgDocuments.filter(d => d.status === 'approved').length
    : receivedDocs.filter(d => d.status === 'approved').length;

  const stats: DashboardStats = {
    templates: {
      count: templates.length,
      limit: organization?.templates_limit ?? 0,
    },
    pending,
    finalized,
  };

  return {
    ownContracts,
    receivedDocs,
    templates,
    orgDocuments,
    stats,
    loading,
    reload: load,
  };
}
