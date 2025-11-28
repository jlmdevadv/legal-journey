import { useEffect, useState, useRef, useCallback } from 'react';

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
  const onSaveRef = useRef(onSave);

  // Keep onSave reference updated
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!enabled) {
      // Clear any existing timeout when disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Set up auto-save
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        setError(null);
        await onSaveRef.current();
        setLastSaved(new Date());
      } catch (err: any) {
        console.error('Auto-save error:', err);
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
  }, [interval, enabled]);

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
