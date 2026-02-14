import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "VOOK",
  description: "Campus Community App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
