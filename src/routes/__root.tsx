import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingChatbot } from "@/components/floating-chatbot";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ScamShield AI — Lá chắn AI chống lừa đảo Việt Nam" },
      { name: "description", content: "Nền tảng AI phân tích URL, ảnh chụp, phân loại bộ gen lừa đảo và bảo vệ người dùng Việt Nam trên không gian số." },
      { property: "og:title", content: "ScamShield AI — Lá chắn AI chống lừa đảo Việt Nam" },
      { property: "og:description", content: "Nền tảng AI phân tích URL, ảnh chụp, phân loại bộ gen lừa đảo và bảo vệ người dùng Việt Nam trên không gian số." },
      { name: "twitter:title", content: "ScamShield AI — Lá chắn AI chống lừa đảo Việt Nam" },
      { name: "twitter:description", content: "Nền tảng AI phân tích URL, ảnh chụp, phân loại bộ gen lừa đảo và bảo vệ người dùng Việt Nam trên không gian số." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0cc93ae5-94ca-41e3-b5d2-79fb038ab173/id-preview-fb58b3bd--ecbd52c2-45c7-422c-9294-90591ae2c29b.lovable.app-1781228199973.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0cc93ae5-94ca-41e3-b5d2-79fb038ab173/id-preview-fb58b3bd--ecbd52c2-45c7-422c-9294-90591ae2c29b.lovable.app-1781228199973.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Không tìm thấy trang</p>
        <a href="/" className="mt-4 inline-block text-primary underline">Về trang chủ</a>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Đã có lỗi</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head><HeadContent /></head>
      <body><div id="root-app">{children}</div><Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
        <FloatingChatbot />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}
