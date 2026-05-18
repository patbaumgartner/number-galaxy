import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Invaders",
  description: "Child-friendly math space game with saved progress and a SQLite-backed Hall of Fame",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
