import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { setAdminSession } from "./session";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="container py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-lg rounded-3xl bg-card border border-border shadow-elegant p-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-widest mb-4">
              <Lock className="h-3.5 w-3.5" />
              Admin access
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Login</h1>
            <p className="text-muted-foreground mb-6">
              Enter your admin email and password to continue.
            </p>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (submitting) return;
                setError(null);
                setSubmitting(true);
                await new Promise((r) => setTimeout(r, 450));
                try {
                  const nextEmail = email.trim();
                  const nextPassword = password;

                  if (!nextEmail || !nextPassword) {
                    setError("Please enter email and password.");
                    return;
                  }

                  const { data, error } = await supabase.rpc("admin_login", {
                    p_email: nextEmail,
                    p_password: nextPassword,
                  });
                  if (error) {
                    const raw = (error.message || "").toLowerCase();
                    const msg = raw.includes("not found") || raw.includes("404")
                      ? "Login RPC not found. In Supabase SQL editor run: select pg_notify('pgrst','reload schema'); then refresh."
                      : raw.includes("permission") || raw.includes("not allowed")
                        ? "Supabase denied this login RPC for the public (anon) key. GRANT EXECUTE to anon or use a server/edge function."
                        : error.message;
                    setError(msg);
                    return;
                  }

                  const row = Array.isArray(data) ? data[0] : null;
                  if (!row) {
                    setError("Invalid email or password.");
                    return;
                  }

                  setAdminSession({
                    adminId: row.id,
                    fullName: row.full_name,
                    email: row.email,
                    createdAt: new Date().toISOString(),
                  });
                  navigate("/admin/overview", { replace: true });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="admin@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    aria-label="Admin email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-12"
                    aria-label="Admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button size="lg" variant="hero" className="w-full" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              {error ? (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Use your admin account credentials to sign in.
                </p>
              )}
            </form>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
