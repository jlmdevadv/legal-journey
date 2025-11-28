import { useEffect, useState, useRef } from 'react';

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  interval?: number;
  enabled?: boolean;
}

export const useAutoSave = ({ onSave, interval = 30000, enabled = true }: UseAutoSaveOptions) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up auto-save
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        setError(null);
        await onSave();
        setLastSaved(new Date());
      } catch (err: any) {
        setError(err.message || 'Erro ao salvar');
      } finally {
        setIsSaving(false);
      }
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onSave, interval, enabled]);

  const saveNow = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave();
      setLastSaved(new Date());
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    lastSaved,
    error,
    saveNow
  };
};
