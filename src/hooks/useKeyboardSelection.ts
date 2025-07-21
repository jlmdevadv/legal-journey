
import { useCallback, useEffect, useState } from 'react';

interface UseKeyboardSelectionProps {
  onTextSelected: (selectedText: string, range: { start: number; end: number }) => void;
  enabled: boolean;
}

export const useKeyboardSelection = ({ onTextSelected, enabled }: UseKeyboardSelectionProps) => {
  const [shiftPressed, setShiftPressed] = useState(false);
  const [selectionInProgress, setSelectionInProgress] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    if (event.key === 'Shift') {
      setShiftPressed(true);
      
      // Check if user is navigating with arrow keys while holding Shift
      const isArrowKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code);
      if (isArrowKey) {
        setSelectionInProgress(true);
      }
    }
  }, [enabled]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    if (event.key === 'Shift' && selectionInProgress) {
      setShiftPressed(false);
      setSelectionInProgress(false);

      // Check if there's a valid text selection
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();
        const range = selection.getRangeAt(0);
        
        console.log('Keyboard selection detected:', selectedText);
        
        onTextSelected(selectedText, {
          start: range.startOffset,
          end: range.endOffset
        });

        // Clear the selection
        selection.removeAllRanges();
      }
    }
  }, [enabled, selectionInProgress, onTextSelected]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [enabled, handleKeyDown, handleKeyUp]);

  return {
    shiftPressed,
    selectionInProgress
  };
};
