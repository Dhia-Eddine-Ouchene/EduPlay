"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

export function SettingsForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState({ name });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [notif, setNotif] = useState(true);
  const [busy, setBusy] = useState(false);

  const saveProfile = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profile.name }) });
      if (!res.ok) return toast("error", "Failed to update profile");
      toast("success", "Profile updated");
      router.refresh();
    } finally { setBusy(false); }
  };

  const changePassword = async () => {
    if (pw.next.length < 8) return toast("error", "New password must be at least 8 characters");
    setBusy(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }) });
      if (!res.ok) { const d = await res.json(); return toast("error", d.error ?? "Failed to change password"); }
      toast("success", "Password changed");
      setPw({ current: "", next: "" });
    } finally { setBusy(false); }
  };

  const deleteAccount = async () => {
    if (!confirm("Delete your account permanently? This cannot be undone.")) return;
    const res = await fetch("/api/settings", { method: "DELETE" });
    if (!res.ok) return toast("error", "Failed to delete account");
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Name</Label><Input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={email} disabled /></div>
          <Button size="sm" onClick={saveProfile} disabled={busy}>Save</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Current password</Label><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
          <div><Label>New password</Label><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
          <Button size="sm" onClick={changePassword} disabled={busy}>Change password</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={notif} onChange={(e) => setNotif(e.target.checked)} /> Email me about student activity and sales</label>
        </CardContent>
      </Card>
      <Card className="border-error">
        <CardHeader><CardTitle className="text-error">Danger zone</CardTitle></CardHeader>
        <CardContent><Button variant="danger" size="sm" onClick={deleteAccount}>Delete account</Button></CardContent>
      </Card>
    </div>
  );
}
