// Server component: no "use client" here. All client logic lives in
// components/Providers.jsx and components/World/*.
import { Big_Shoulders, Instrument_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import SceneLoader from "@/components/World/SceneLoader";
import { themeCssVars, colors } from "@/lib/theme";
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
        {/* No JavaScript means no stars: show the real headline as plain text. */}
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              "<style>.hero-h1{position:static;width:auto;height:auto;margin:0;overflow:visible;clip-path:none}" +
              ".journey-spacer{height:0}.squad-stop{position:relative;inset:auto;min-height:100svh;--stop-fg:var(--astra-white);visibility:visible;pointer-events:auto}" +
              ".roster-dot{background:var(--astra-red)}.progress-marks{display:none}</style>",
          }}
        />
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
