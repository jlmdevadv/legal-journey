import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ContractProvider } from "@/contexts/ContractContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MasterProtectedRoute from "@/components/auth/MasterProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MeusContratos from "./pages/MeusContratos";
import MasterDashboard from "./pages/MasterDashboard";
import MasterTemplateEditor from "./pages/MasterTemplateEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ContractProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/meus-contratos" 
                element={
                  <ProtectedRoute>
                    <MeusContratos />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/master"
                element={
                  <MasterProtectedRoute>
                    <MasterDashboard />
                  </MasterProtectedRoute>
                }
              />
              <Route
                path="/master/template/:templateId"
                element={
                  <MasterProtectedRoute>
                    <MasterTemplateEditor />
                  </MasterProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ContractProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
