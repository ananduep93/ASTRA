import Script from "next/script";
import "./globals.css";
import Providers from "./Providers";

export const metadata = {
  title: "ASTRA 2026 | Inter-College Arts & Tech Fest",
  description:
    "Don Bosco College, Mampetta presents ASTRA — an inter-college fest colliding arts, technology, gaming, business and fun.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <Script
          id="intro-pending-detection"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var search = window.location.search || '';
                var isForced = search.indexOf('intro') !== -1;
                var seen = sessionStorage.getItem('astra_intro_seen');
                var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if ((!seen || isForced) && !prefersReduced && (window.location.pathname === '/' || window.location.pathname === '')) {
                  document.documentElement.classList.add('astra-intro-pending');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
