import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRISHUL Document Intelligence | Enterprise Verification Platform",
  description:
    "Secure identity document scanning, optical character recognition, forensic analysis, and verification platform for authorized organizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen antialiased selection:bg-trishul-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
