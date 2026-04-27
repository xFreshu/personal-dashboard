import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "./components/AuthProvider";
import Sidebar from "./components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Internal Team Dashboard",
  description: "Wewnętrzny dashboard dla zespołu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="flex h-screen bg-background text-foreground overflow-hidden">
        <AuthProvider>
          <Sidebar />
          <div className="min-h-0 flex-1 overflow-y-auto w-full">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
