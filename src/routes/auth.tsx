import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Đăng nhập — ScamShield AI" }] }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Đăng ký thành công"); navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Đăng nhập thành công"); navigate({ to: "/" });
      }
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error("Đăng nhập Google thất bại");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <Card className="w-full p-6">
        <div className="text-center">
          <div className="bg-gradient-cyber mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-white"><Shield className="h-6 w-6" /></div>
          <h1 className="mt-3 text-2xl font-bold">{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
          <p className="text-sm text-muted-foreground">Truy cập tính năng cá nhân của ScamShield</p>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          {mode === "signup" && <div><Label>Họ tên</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>}
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><Label>Mật khẩu</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
          <Button type="submit" disabled={busy} className="bg-gradient-cyber w-full">{busy ? "..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}</Button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">hoặc</div>
        <Button onClick={google} variant="outline" className="w-full">Tiếp tục với Google</Button>
        <div className="mt-4 text-center text-sm">
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary underline">
            {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
          </button>
        </div>
      </Card>
    </div>
  );
}
