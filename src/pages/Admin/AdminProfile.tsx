import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";
import { clearAdminSession, getAdminSession, setAdminSession } from "./session";

type AdminRow = {
  id: string;
  full_name: string;
  email: string;
};

export default function AdminProfile() {
  const navigate = useNavigate();
  const session = useMemo(() => (typeof window !== "undefined" ? getAdminSession() : null), []);

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  const [passSaving, setPassSaving] = useState(false);
  const [passSaved, setPassSaved] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!session?.adminId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, full_name, email")
        .eq("id", session.adminId)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          toast.error(error.message);
        } else if (data) {
          const row = data as AdminRow;
          setFullName(row.full_name);
          setEmail(row.email);
          setAdminSession({ adminId: row.id, fullName: row.full_name, email: row.email, createdAt: session.createdAt });
        }
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session?.adminId, session?.createdAt]);

  const canEdit = Boolean(session?.adminId) && !loading;

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-secondary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Admin profile</div>
              <div className="text-lg font-extrabold truncate">{session?.fullName ?? "—"}</div>
              <div className="text-sm text-muted-foreground truncate">{session?.email ?? "—"}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 max-w-xl">
            <div className="grid gap-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Admin" disabled={!canEdit} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@domain.com" disabled={!canEdit} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button
              className="rounded-2xl"
              disabled={!canEdit}
              onClick={async () => {
                if (!session?.adminId) return;
                const nextFullName = fullName.trim();
                const nextEmail = email.trim();
                if (!nextFullName || !nextEmail) {
                  toast.error("Full name and email are required.");
                  return;
                }

                const { error } = await supabase
                  .from("admin_users")
                  .update({ full_name: nextFullName, email: nextEmail })
                  .eq("id", session.adminId);

                if (error) {
                  toast.error(error.message);
                  return;
                }

                setAdminSession({ adminId: session.adminId, fullName: nextFullName, email: nextEmail, createdAt: session.createdAt });
                setSaved(true);
                setTimeout(() => setSaved(false), 1200);
                toast.success("Profile updated");
              }}
            >
              {saved ? (
                <>
                  <Check />
                  Saved
                </>
              ) : (
                "Save changes"
              )}
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                clearAdminSession();
                navigate("/login", { replace: true });
              }}
            >
              Sign out
              <LogOut />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="text-sm font-extrabold">Change password</div>
          <div className="mt-1 text-xs text-muted-foreground">Updates your password in `admin_users`.</div>

          <div className="mt-6 grid gap-4 max-w-xl">
            <div className="grid gap-2">
              <Label>Current password</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={!canEdit || passSaving} />
            </div>
            <div className="grid gap-2">
              <Label>New password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={!canEdit || passSaving} />
            </div>
            <div className="grid gap-2">
              <Label>Confirm new password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={!canEdit || passSaving} />
            </div>
          </div>

          {passError ? <div className="mt-4 text-sm text-red-600 dark:text-red-400">{passError}</div> : null}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button
              className="rounded-2xl"
              disabled={!canEdit || passSaving}
              onClick={async () => {
                setPassError(null);
                if (!session?.adminId) return;
                if (!currentPassword || !newPassword || !confirmPassword) {
                  setPassError("Please fill all password fields.");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  setPassError("New passwords do not match.");
                  return;
                }
                if (newPassword.length < 8) {
                  setPassError("New password must be at least 8 characters.");
                  return;
                }

                setPassSaving(true);
                const { data, error } = await supabase.rpc("admin_change_password", {
                  p_id: session.adminId,
                  p_current_password: currentPassword,
                  p_new_password: newPassword,
                });
                setPassSaving(false);

                if (error) {
                  setPassError(error.message);
                  toast.error(error.message);
                  return;
                }
                if (data !== true) {
                  setPassError("Current password is incorrect.");
                  toast.error("Current password is incorrect.");
                  return;
                }

                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPassSaved(true);
                setTimeout(() => setPassSaved(false), 1200);
                toast.success("Password updated");
              }}
            >
              {passSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : passSaved ? (
                <>
                  <Check />
                  Updated
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
