// Server component: no "use client" here. Client logic lives in components/Providers.jsx and the issue.
import { Bricolage_Grotesque, Courier_Prime } from "next/font/google";
import Providers from "@/components/Providers";
import { themeCssVars, colors } from "@/lib/theme";
import "./globals.css";

// Display: heavy grotesque with character (not condensed, not cartoon).
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

// Captions: clean typewriter mono.
const mono = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  display: "swap",
});

// Icons and the share image are files in app/ (icon.png, apple-icon.png,
// favicon.ico, opengraph-image.png), built by scripts/make-brand.py.
export const metadata = {
  title: "ASTRA #2027",
  description: "ASTRA 2027, the inter-college arts and tech fest of Don Bosco College, Mampetta. Read the issue.",
  // Placeholder until the real domain is known: lets Next build absolute og:image URLs.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export const viewport = {
  themeColor: colors.paper,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the inline script below removes "no-js" before React loads.
    <html lang="en" className={`no-js ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Theme tokens from lib/theme.js, defined once */}
        <style dangerouslySetInnerHTML={{ __html: themeCssVars() }} />
        {/* JavaScript is on: the live issue (otherwise the pages simply stack). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.remove('no-js')" }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
