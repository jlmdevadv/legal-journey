
import { useCallback, useEffect, useState } from 'react';

interface UseKeyboardSelectionProps {
  onTextSelected: (selectedText: string, range: { start: number; end: number }) => void;
  enabled: boolean;
}

export const useKeyboardSelection = ({ onTextSelected, enabled }: UseKeyboardSelectionProps) => {
  const [shiftPressed, setShiftPressed] = useState(false);
  const [selectionInProgress, setSelectionInProgress] = useState(false);

  const isArrowKey = (code: string): boolean => {
    return ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(code);
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    console.log('Key down:', event.key, 'Shift pressed:', shiftPressed);

    if (event.key === 'Shift') {
      setShiftPressed(true);
      console.log('Shift key pressed - enabling selection mode');
    } else if (shiftPressed && isArrowKey(event.code)) {
      console.log('Arrow key pressed while Shift is held - starting selection');
      setSelectionInProgress(true);
    }
  }, [enabled, shiftPressed]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    console.log('Key up:', event.key, 'Selection in progress:', selectionInProgress);

    if (event.key === 'Shift') {
      console.log('Shift key released');
      
      // Sempre resetar o estado visual primeiro
      setShiftPressed(false);
      
      // Verificar se há seleção válida apenas se houve seleção em progresso
      if (selectionInProgress) {
        const selection = window.getSelection();
        console.log('Checking selection:', selection?.toString());
        
        if (selection && selection.toString().trim()) {
          const selectedText = selection.toString().trim();
          const range = selection.getRangeAt(0);
          
          console.log('Valid keyboard selection detected:', selectedText);
          
          onTextSelected(selectedText, {
            start: range.startOffset,
            end: range.endOffset
          });

          // NÃO limpar a seleção visual - deixar o usuário decidir
          // selection.removeAllRanges();
        } else {
          console.log('No valid text selected');
        }
        
        // Sempre resetar o estado de seleção em progresso
        setSelectionInProgress(false);
      } else {
        console.log('No selection was in progress');
      }
    }
  }, [enabled, selectionInProgress, onTextSelected]);

  useEffect(() => {
    if (enabled) {
      console.log('Keyboard selection enabled');
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);

      return () => {
        console.log('Keyboard selection disabled');
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      };
    } else {
      // Reset states when disabled
      setShiftPressed(false);
      setSelectionInProgress(false);
    }
  }, [enabled, handleKeyDown, handleKeyUp]);

  return {
    shiftPressed,
    selectionInProgress
  };
};
