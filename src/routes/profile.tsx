import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Tài khoản — ScamShield AI" }] }),
  component: Profile,
});

function Profile() {
  const [user, setUser] = useState<{ email: string | null; id: string } | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; analysis_type: string; input_summary: string | null; risk_level: string | null; created_at: string }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { navigate({ to: "/auth" }); return; }
      setUser({ email: data.user.email ?? null, id: data.user.id });
      const { data: h } = await supabase.from("analysis_history").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false }).limit(20);
      if (h) setHistory(h as never);
    });
  }, [navigate]);

  async function signOut() { await supabase.auth.signOut(); navigate({ to: "/" }); }

  if (!user) return null;
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Tài khoản của bạn</h1>
      <Card className="mt-6 p-6">
        <div className="text-sm text-muted-foreground">Email</div>
        <div className="text-lg font-medium">{user.email}</div>
        <Button onClick={signOut} variant="outline" className="mt-4">Đăng xuất</Button>
      </Card>
      <h2 className="mt-8 text-xl font-semibold">Lịch sử phân tích</h2>
      <div className="mt-3 space-y-2">
        {history.length === 0 && <p className="text-sm text-muted-foreground">Chưa có lịch sử.</p>}
        {history.map((h) => (
          <Card key={h.id} className="p-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{h.analysis_type}</span>
              <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("vi-VN")}</span>
            </div>
            <div className="text-muted-foreground">{h.input_summary}</div>
            {h.risk_level && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{h.risk_level}</span>}
          </Card>
        ))}
      </div>
    </div>
  );
}
