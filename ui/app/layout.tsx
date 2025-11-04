// ui/app/layout.tsx

import "./globals.css";
import Header from "@/components/Header";
import { getLang, getMessages } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";

export const metadata = {
  title: "HashStorm Pools",
  description: "Multi-coin mining pool platform - powered by HashStorm",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "HashStorm Pools",
    description: "High-performance mining pools for BTCZ and more.",
    images: ["/favicon.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const messages = getMessages();

  return (
    <html lang={lang}>
      <body>
        <I18nProvider lang={lang} messages={messages}>
          <Header />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
