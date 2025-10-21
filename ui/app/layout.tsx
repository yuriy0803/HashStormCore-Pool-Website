import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "HashStorm Pool",
  description: "Multi-coin mining pool"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        <Header/>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
