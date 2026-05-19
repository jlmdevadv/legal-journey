import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, Building2 } from 'lucide-react';
import { PartyRegistryEntry } from '@/types/template';
import { usePartyRegistry } from '@/hooks/usePartyRegistry';

interface PartyRegistryLookupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (entry: PartyRegistryEntry) => void;
}

const PartyRegistryLookup = ({ open, onOpenChange, onSelect }: PartyRegistryLookupProps) => {
  const { entries, loading } = usePartyRegistry();
  const [query, setQuery] = useState('');

  const filtered = entries.filter(e =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    (e.document ?? '').includes(query)
  );

  const handleSelect = (entry: PartyRegistryEntry) => {
    onSelect(entry);
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar no Cadastro de Partes</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou documento..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {entries.length === 0 ? 'Nenhuma parte cadastrada.' : 'Nenhum resultado encontrado.'}
          </p>
        ) : (
          <ul className="divide-y divide-border max-h-72 overflow-y-auto rounded-md border border-border">
            {filtered.map(entry => (
              <li key={entry.id}>
                <button
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3"
                  onClick={() => handleSelect(entry)}
                >
                  {entry.person_type === 'PJ'
                    ? <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                  <div>
                    <p className="text-sm font-medium">{entry.name}</p>
                    {entry.document && (
                      <p className="text-xs text-muted-foreground">{entry.document}</p>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">{entry.person_type}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PartyRegistryLookup;
