import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PartyRegistryEntry, PersonType } from '@/types/template';
import { toast } from 'sonner';

interface UsePartyRegistryReturn {
  entries: PartyRegistryEntry[];
  loading: boolean;
  add: (entry: Omit<PartyRegistryEntry, 'id' | 'owner_id' | 'created_at'>) => Promise<PartyRegistryEntry | null>;
  update: (id: string, entry: Partial<Omit<PartyRegistryEntry, 'id' | 'owner_id'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reload: () => void;
}

export function usePartyRegistry(): UsePartyRegistryReturn {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PartyRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('party_registry')
      .select('*')
      .eq('owner_id', user.id)
      .order('name');
    if (error) {
      toast.error('Erro ao carregar cadastro de partes: ' + error.message);
    } else {
      setEntries((data ?? []).map(r => ({
        ...r,
        person_type: r.person_type as PersonType,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const add = async (
    entry: Omit<PartyRegistryEntry, 'id' | 'owner_id' | 'created_at'>
  ): Promise<PartyRegistryEntry | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('party_registry')
      .insert({ ...entry, owner_id: user.id })
      .select()
      .single();
    if (error) { toast.error('Erro ao salvar parte: ' + error.message); return null; }
    const saved = { ...data, person_type: data.person_type as PersonType };
    setEntries(prev => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
    return saved;
  };

  const update = async (
    id: string,
    entry: Partial<Omit<PartyRegistryEntry, 'id' | 'owner_id'>>
  ): Promise<void> => {
    const { error } = await supabase
      .from('party_registry')
      .update(entry)
      .eq('id', id);
    if (error) { toast.error('Erro ao atualizar parte: ' + error.message); return; }
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...entry } : e));
  };

  const remove = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('party_registry')
      .delete()
      .eq('id', id);
    if (error) { toast.error('Erro ao remover parte: ' + error.message); return; }
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return { entries, loading, add, update, remove, reload: load };
}
