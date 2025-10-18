import { supabase } from '@/integrations/supabase/client';
import { contractTemplates } from '@/data/contractTemplates';

export const seedDefaultTemplates = async () => {
  console.log('🌱 Iniciando seed de templates padrão...');
  
  for (const template of contractTemplates) {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('contract_templates')
      .select('id')
      .eq('id', template.id)
      .single();
    
    if (existing) {
      console.log(`⏭️  Template ${template.id} já existe, pulando...`);
      continue;
    }
    
    // Inserir template padrão
    const templateWithMetadata = {
      ...template,
      is_default: true,
      version: {
        version: "1.0",
        history: []
      } as any,
      created_by: 'system',
      created_at: new Date().toISOString(),
      fields: template.fields as any
    };
    
    const { error } = await supabase
      .from('contract_templates')
      .insert([templateWithMetadata as any]);
    
    if (error) {
      console.error(`❌ Erro ao inserir template ${template.id}:`, error);
    } else {
      console.log(`✅ Template ${template.id} inserido com sucesso`);
    }
  }
  
  console.log('🎉 Seed concluído!');
};
