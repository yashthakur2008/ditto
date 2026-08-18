import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Lexend } from "next/font/google";
import { FlowProvider } from "@/components/flow/FlowProvider";
import { Shell } from "@/components/layout/Shell";
import { PrefThemeScript } from "@/components/a11y/PrefThemeScript";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ditto — make the web easier to read",
  description:
    "Ditto helps make websites easier to read, safer to navigate, and more accessible for everyone.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${atkinson.variable} ${lexend.variable}`} suppressHydrationWarning>
      <head>
        <PrefThemeScript />
      </head>
      <body>
        <FlowProvider>
          <Shell>{children}</Shell>
        </FlowProvider>
      </body>
    </html>
  );
}
