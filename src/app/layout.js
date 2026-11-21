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
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
