import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { routes } from "./routes";

const queryClient = new QueryClient();

// Determine if we're running in production (GitHub Pages)
const isProduction = import.meta.env.MODE === 'production';
//const basename = isProduction ? '/event-orchestrator-hq' : '/';
const basename = '/';
// if (process) {
//   basename = process?.env?.BASE_PATH || '/';
// }

  // Router component that uses the route config
function Router() {
  return useRoutes(routes);
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={basename}>
          <Router />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
