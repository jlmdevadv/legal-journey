import { useEffect } from 'react';
import { ContractTemplate } from '@/types/template';
import { getVisibleFields } from '@/utils/conditionalLogic';

export const useContractPreviewScroll = (
  currentQuestionIndex: number, 
  numberOfParties: number, 
  numberOfOtherParties: number,
  selectedTemplate: ContractTemplate | null,
  formValues: Record<string, string>
) => {
  useEffect(() => {
    // Delay para garantir que seções estejam renderizadas antes do scroll
    const timer = setTimeout(() => {
      console.log('[SCROLL-DEBUG] Index mudou:', currentQuestionIndex);
      
      const scrollToSection = (sectionId: string) => {
        console.log('[SCROLL-DEBUG] Tentando rolar para:', sectionId);
        
        const section = document.getElementById(sectionId);
        const scrollArea = document.querySelector('[data-contract-preview-scroll]');
        
        if (!section) {
          console.warn('[SCROLL-DEBUG] Seção não encontrada:', sectionId);
          return;
        }
        
        if (!scrollArea) {
          console.warn('[SCROLL-DEBUG] ScrollArea não encontrada');
          return;
        }
        
        console.log('[SCROLL-DEBUG] Seção encontrada:', sectionId);
        
        const scrollViewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          const sectionTop = section.offsetTop;
          console.log('[SCROLL-DEBUG] Executando scroll para:', { sectionId, sectionTop });
          
          scrollViewport.scrollTo({
            top: Math.max(0, sectionTop - 20),
            behavior: 'smooth'
          });
        } else {
          // Fallback: tentar scroll direto no scrollArea
          console.warn('[SCROLL-DEBUG] ScrollViewport não encontrado, usando fallback');
          (scrollArea as HTMLElement).scrollTo({
            top: Math.max(0, section.offsetTop - 20),
            behavior: 'smooth'
          });
        }
      };

    // Mapeamento de índices para seções do preview
    if (currentQuestionIndex === -1) {
      // Welcome screen -> título
      scrollToSection('preview-section-title');
    } else if (currentQuestionIndex === -2) {
      // Pergunta número de partes -> seção de partes
      scrollToSection('preview-section-parties');
    } else if (currentQuestionIndex >= -1000 && currentQuestionIndex < -1000 + numberOfParties) {
      // Preenchendo dados das partes principais -> seção de partes
      scrollToSection('preview-section-parties');
    } else if (currentQuestionIndex === -4 || currentQuestionIndex === -5) {
      // Pergunta sobre outras partes -> seção de outras partes
      scrollToSection('preview-section-other-parties');
    } else if (currentQuestionIndex >= -2000 && currentQuestionIndex < -2000 + numberOfOtherParties) {
      // Preenchendo dados de outras partes -> seção de outras partes
      scrollToSection('preview-section-other-parties');
    } else if (currentQuestionIndex >= -3000 && currentQuestionIndex < -3) {
      // Campos repetíveis -> corpo do contrato
      scrollToSection('preview-section-body');
    } else if (currentQuestionIndex === -3) {
      // Local e data -> seção de local/data
      scrollToSection('preview-section-location');
    } else if (currentQuestionIndex >= -1000 + numberOfParties) {
      // Perguntas do template - scroll proporcional dentro do corpo
      const section = document.getElementById('preview-section-body');
      const scrollArea = document.querySelector('[data-contract-preview-scroll]');
      
      if (section && scrollArea && selectedTemplate) {
        const scrollViewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
        const visibleFields = getVisibleFields(selectedTemplate.fields, formValues);
        const templateQuestionIndex = currentQuestionIndex + 1000 - numberOfParties;
        
        if (scrollViewport && templateQuestionIndex >= 0 && templateQuestionIndex < visibleFields.length) {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          const progress = templateQuestionIndex / visibleFields.length;
          const targetPosition = sectionTop + (sectionHeight * progress);
          
          console.log('[SCROLL-DEBUG] Scroll proporcional no corpo:', { 
            templateQuestionIndex, 
            progress, 
            targetPosition 
          });
          
          scrollViewport.scrollTo({
            top: Math.max(0, targetPosition - 100),
            behavior: 'smooth'
          });
        } else if (scrollViewport && templateQuestionIndex === visibleFields.length) {
          // Summary screen - scroll to end
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          console.log('[SCROLL-DEBUG] Scroll para o fim (summary)');
          
          scrollViewport.scrollTo({
            top: sectionTop + sectionHeight - 100,
            behavior: 'smooth'
          });
        }
      }
    }
    }, 100); // Delay de 100ms para garantir renderização
    
    return () => clearTimeout(timer);
  }, [currentQuestionIndex, numberOfParties, numberOfOtherParties, selectedTemplate, formValues]);
};
