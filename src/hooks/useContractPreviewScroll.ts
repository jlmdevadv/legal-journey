import { useEffect } from 'react';

export const useContractPreviewScroll = (
  currentQuestionIndex: number, 
  numberOfParties: number, 
  numberOfOtherParties: number
) => {
  useEffect(() => {
    const scrollToSection = (sectionId: string) => {
      const section = document.getElementById(sectionId);
      const scrollArea = document.querySelector('[data-contract-preview-scroll]');
      
      if (section && scrollArea) {
        const scrollViewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          const sectionTop = section.offsetTop;
          scrollViewport.scrollTo({
            top: Math.max(0, sectionTop - 20),
            behavior: 'smooth'
          });
        }
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
    } else if (currentQuestionIndex === -3) {
      // Local e data -> seção de local/data
      scrollToSection('preview-section-location');
    } else if (currentQuestionIndex >= -1000 + numberOfParties) {
      // Perguntas do template (índices começam em -1000 + numberOfParties) -> corpo do contrato
      scrollToSection('preview-section-body');
    }
  }, [currentQuestionIndex, numberOfParties, numberOfOtherParties]);
};
