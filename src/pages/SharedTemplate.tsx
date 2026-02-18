import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SharedQuestionnaireContainer from '@/components/shared/SharedQuestionnaireContainer';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ShareLinkValidation {
  valid: boolean;
  error?: string;
  template_id?: string;
  organization_id?: string;
  template_name?: string;
  organization_name?: string;
  share_link_id?: string;
}

const SharedTemplate = () => {
  const { token } = useParams<{ token: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [validation, setValidation] = useState<ShareLinkValidation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    validateLink();
  }, [token]);

  useEffect(() => {
    if (!authLoading && !user && validation?.valid) {
      // Save token and redirect to auth
      sessionStorage.setItem('pendingShareToken', token!);
      navigate('/auth?redirect=shared', { replace: true });
    }
  }, [authLoading, user, validation]);

  const validateLink = async () => {
    try {
      const { data, error } = await supabase.rpc('validate_share_link', {
        link_token: token!,
      });

      if (error) throw error;
      setValidation(data as unknown as ShareLinkValidation);
    } catch (error: any) {
      setValidation({ valid: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!validation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
            <CardTitle>Link Inválido</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {validation?.error || 'Este link de preenchimento não é válido ou expirou.'}
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Ir para a Página Inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SharedQuestionnaireContainer
      templateId={validation.template_id!}
      organizationId={validation.organization_id!}
      organizationName={validation.organization_name!}
      templateName={validation.template_name!}
      shareLinkId={validation.share_link_id!}
    />
  );
};

export default SharedTemplate;
