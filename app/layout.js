// Server component: no "use client" here. All client logic lives in
// components/Providers.jsx and components/World/*.
import { Big_Shoulders, Instrument_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import SceneLoader from "@/components/World/SceneLoader";
import { themeCssVars, colors } from "@/lib/theme";
import { staticCss, noscriptCss } from "@/lib/staticCss";
import "./globals.css";

const display = Big_Shoulders({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  variable: "--font-big-shoulders",
  display: "swap",
  // next/font has no metrics for this family, so skip its auto fallback
  // (silences a build warning) and name a plain fallback instead.
  adjustFontFallback: false,
  fallback: ["sans-serif"],
});

const body = Instrument_Sans({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata = {
  title: "ASTRA 2027",
  description: "ASTRA 2027, the inter-college arts and tech fest of Don Bosco College, Mampetta.",
};

export const viewport = {
  themeColor: colors.black,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        {/* Theme tokens from lib/theme.js, defined once */}
        <style dangerouslySetInnerHTML={{ __html: themeCssVars() }} />
        {/* Static mode (low tier / no WebGL / reduced motion): one rule list, lib/staticCss.js */}
        <style dangerouslySetInnerHTML={{ __html: staticCss() }} />
        {/* No JavaScript means no stars: the same static layout. */}
        <noscript dangerouslySetInnerHTML={{ __html: `<style>${noscriptCss()}</style>` }} />
      </head>
      <body>
        <Providers>
          <SceneLoader />
          <div className="relative z-10">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
