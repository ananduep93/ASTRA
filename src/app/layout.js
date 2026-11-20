import "./globals.css";
import Providers from "./Providers";

export const metadata = {
  title: "ASTRA 2026 | Inter-College Arts & Tech Fest",
  description:
    "Don Bosco College, Mampetta presents ASTRA — an inter-college arts and technology fest exploring the tension between INK and CODE.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-world="ink" suppressHydrationWarning className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
