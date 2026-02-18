import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  templates_limit: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  organization: Organization | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const { toast } = useToast();

  // Check if user is admin
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: userId, _role: 'admin' });
      
      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      setIsAdmin(false);
    }
  };

  // Check if user is master and fetch organization
  const checkMasterRole = async (userId: string) => {
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'master')
        .maybeSingle();

      if (rolesError || !roles) {
        setIsMaster(false);
        setOrganization(null);
        return;
      }

      setIsMaster(true);

      const { data: orgData, error: orgError } = await supabase
        .rpc('get_user_organization');

      if (!orgError && orgData && orgData.length > 0) {
        setOrganization(orgData[0] as Organization);
      } else {
        setOrganization(null);
      }
    } catch (error) {
      setIsMaster(false);
      setOrganization(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async (currentSession: Session | null) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        await Promise.all([
          checkAdminStatus(currentSession.user.id),
          checkMasterRole(currentSession.user.id),
        ]);
      } else {
        setIsAdmin(false);
        setIsMaster(false);
        setOrganization(null);
      }
      
      setIsLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Use setTimeout to avoid blocking the Supabase callback
        setTimeout(() => initializeAuth(currentSession), 0);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      initializeAuth(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || email
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: error.message
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Você já pode fazer login."
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: error.message
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: "Credenciais inválidas. Verifique seu email e senha."
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setIsMaster(false);
      setOrganization(null);
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no logout",
        description: error.message
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        isMaster,
        organization,
        signUp,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
