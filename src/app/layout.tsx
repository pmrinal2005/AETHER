import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "A.I.M. — Agent Instant Messenger & Identity Manager",
  description:
    "The Switzerland of Agent Trust — dressed as your old Buddy List. A W3C-standards-based Agent Passport + Trust Score + Revocation infrastructure, delivered through a pixel-perfect Windows-XP-era AIM/ICQ desktop.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
