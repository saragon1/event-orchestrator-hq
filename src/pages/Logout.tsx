import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Logout = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth(); // Get logout function and user state
  const { toast } = useToast();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        toast({ title: "Logged out successfully" });
        // AuthProvider's onAuthStateChange will handle redirect via ProtectedRoute
        // Or, navigate directly if preferred, but might conflict if user state updates slowly
        navigate("/login", { replace: true }); 
      } catch (error) {
        toast({ 
          title: "Logout failed", 
          description: "Could not log out. Please try again.",
          variant: "destructive" 
        });
        console.error("Logout error:", error);
        // Optionally redirect even if logout fails, or stay on page
        // navigate("/login");
      }
    };

    // Only attempt logout if the user is currently logged in
    if (user) {
      performLogout();
    } else {
      // If user is already null (e.g., direct navigation to /logout), redirect immediately
      navigate("/login", { replace: true });
    }

    // No cleanup needed as logout is a one-time async action per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logout, navigate, user]); // Add user to dependency array

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
        <h1 className="text-2xl font-bold mb-2">Logging out...</h1>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
};

export default Logout; 