
export const detectPlaceholders = (text: string): string[] => {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const variableName = match[1].trim();
    
    // Ignorar tags de controle condicional ({{#if}}, {{/if}}, etc.)
    if (variableName.startsWith('#') || variableName.startsWith('/')) {
      continue;
    }
    
    if (variableName && !matches.includes(variableName)) {
      matches.push(variableName);
    }
  }
  
  return matches;
};

export const humanizeVariableName = (varName: string): string => {
  return varName
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
};

export const sanitizeVariableName = (varName: string): string => {
  return varName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};
