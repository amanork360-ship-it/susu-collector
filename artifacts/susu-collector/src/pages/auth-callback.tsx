import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg("Could not complete Google sign-in. Please try again.");
        }
        return;
      }

      const accessToken = sessionData.session.access_token;

      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to authenticate with server");
        }

        const data = await res.json();

        if (!cancelled) {
          login(data.token);
          toast({
            title: "Welcome!",
            description: `Signed in as ${data.collector.name}`,
          });
          setLocation("/dashboard");
        }
      } catch (err: any) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(err.message || "Authentication failed. Please try again.");
        }
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center p-4 bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        {status === "loading" ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">Completing sign-in...</p>
          </>
        ) : (
          <>
            <p className="text-destructive font-medium">{errorMsg}</p>
            <button
              onClick={() => setLocation("/login")}
              className="text-sm text-primary underline"
              data-testid="link-back-to-login"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
