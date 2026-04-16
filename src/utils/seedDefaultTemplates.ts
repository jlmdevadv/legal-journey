import { supabase } from '@/integrations/supabase/client';
import { contractTemplates } from '@/data/contractTemplates';

export const seedDefaultTemplates = async () => {
  for (const template of contractTemplates) {
    const { data: existing } = await supabase
      .from('contract_templates')
      .select('id')
      .eq('id', template.id)
      .single();

    if (existing) continue;

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
      console.error(`Failed to seed template ${template.id}:`, error);
    }
  }
};
