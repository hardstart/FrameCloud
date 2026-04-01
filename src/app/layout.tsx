import type { Metadata } from "next";
import { Instrument_Sans, Share_Tech_Mono } from "next/font/google";
import "@/styles/globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FrameCloud",
    template: "%s | FrameCloud",
  },
  description: "A cinematic photo album experience by FrameCloud",
  openGraph: {
    title: "FrameCloud",
    description: "A cinematic photo album experience by FrameCloud",
    siteName: "FrameCloud",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FrameCloud",
    description: "A cinematic photo album experience by FrameCloud",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${shareTechMono.variable}`}>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
