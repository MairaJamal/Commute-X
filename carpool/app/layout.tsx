import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./Navbar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CommuteX — Share the route, split the fare",
  description: "AI-matched carpooling for campuses & offices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased bg-paper text-ink min-h-screen flex flex-col justify-between">
        <div>
          <Navbar />
          <main>{children}</main>
        </div>
        <footer className="site">
          <div className="wrap">
            <div className="logo" style={{ fontSize: '15px' }}>
              <span className="logo-dot"></span>
              CommuteX
            </div>
            <span>© 2026 CommuteX · Prototype build</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
