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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onSaveRef = useRef(onSave);
  const prevEnabledRef = useRef(enabled);

  // Keep onSave reference updated
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Save when transitioning from enabled to disabled
  useEffect(() => {
    const wasEnabled = prevEnabledRef.current;
    const isNowDisabled = !enabled;
    
    if (wasEnabled && isNowDisabled) {
      console.log('[AUTO-SAVE] Salvando ao desabilitar...');
      const performSaveOnDisable = async () => {
        try {
          setIsSaving(true);
          setError(null);
          await onSaveRef.current();
          setLastSaved(new Date());
        } catch (err: any) {
          console.error('Auto-save on disable error:', err);
          setError(err.message || 'Erro ao salvar');
        } finally {
          setIsSaving(false);
        }
      };
      performSaveOnDisable();
    }
    
    prevEnabledRef.current = enabled;
  }, [enabled]);

  // Recurring auto-save with setInterval
  useEffect(() => {
    if (!enabled) {
      // Clear any existing interval when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up recurring auto-save
    intervalRef.current = setInterval(async () => {
      console.log('[AUTO-SAVE] Salvando automaticamente...');
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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
