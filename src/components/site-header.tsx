import { Link } from "@tanstack/react-router";
import { Shield, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/dna-map", label: "Bản đồ Bộ Gen" },
  { to: "/screenshot-detector", label: "Quét ảnh" },
  { to: "/reports", label: "Báo cáo" },
  { to: "/analytics", label: "Thống kê" },
  { to: "/emergency", label: "Khẩn cấp" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email: string | null } | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ email: data.user.email ?? null });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ? { email: s.user.email ?? null } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="bg-gradient-cyber flex h-9 w-9 items-center justify-center rounded-lg shadow-cyber">
            <Shield className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg tracking-tight">ScamShield <span className="text-cyber">AI</span></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link to="/profile"><Button variant="outline" size="sm">Tài khoản</Button></Link>
          ) : (
            <Link to="/auth"><Button size="sm" className="bg-gradient-cyber shadow-cyber">Đăng nhập</Button></Link>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="flex flex-col gap-1 p-4">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                {n.label}
              </Link>
            ))}
            {user ? (
              <Link to="/profile" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Tài khoản</Link>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Đăng nhập</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
