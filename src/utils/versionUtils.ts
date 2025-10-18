import { ContractTemplate } from '@/types/template';

export const incrementVersion = (currentVersion: string): string => {
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  
  // Incrementar versão minor (1.0 -> 1.1 -> 1.2)
  return `${major}.${minor + 1}`;
};

export const createNewVersion = (
  template: ContractTemplate,
  changesDescription: string
): any => {
  const currentVersionData = {
    version: template.version?.version || "1.0",
    date: new Date().toISOString(),
    changes: changesDescription,
    template_snapshot: template.template
  };

  let history = template.version?.history || [];
  
  // Adicionar versão atual ao histórico
  history = [currentVersionData, ...history];
  
  // Limitar a 2 versões anteriores
  if (history.length > 2) {
    history = history.slice(0, 2);
  }

  const newVersion = incrementVersion(template.version?.version || "1.0");

  return {
    version: newVersion,
    history: history
  };
};

export const restoreVersion = (
  template: ContractTemplate,
  versionToRestore: string
): ContractTemplate | null => {
  const versionData = template.version?.history?.find(
    (v: any) => v.version === versionToRestore
  );

  if (!versionData || !versionData.template_snapshot) {
    return null;
  }

  return {
    ...template,
    template: versionData.template_snapshot
  };
};
