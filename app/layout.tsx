// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import HeaderRoot from "@/components/header/HeaderRoot";
import Footer from "@/components/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import FieldlyAssist from "@/components/FieldlyAssist";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { QueryProvider } from "@/lib/react-query/providers";
import { NotificationInitializer } from "@/components/shared/notifications/NotificationInitializer";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Fieldly - Empowering Farmers, Unlocking Land",
  description:
    "Fieldly connects landowners and farmers through transparent land leasing.",
  icons: "/image.png",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClerkProvider>
          <QueryProvider>
            <DashboardProvider>
              {/* Notification realtime connection */}
              <NotificationInitializer />

              <HeaderRoot />
              <main className="min-h-screen w-full flex flex-col items-center">
                <div className="w-full flex-1">{children}</div>
              </main>
              <FieldlyAssist />
              <Footer />
              <Toaster position="top-right" richColors />
            </DashboardProvider>
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
