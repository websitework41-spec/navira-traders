import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { AuthProvider } from "@/context/AuthContext";
import { ButtonRipple } from "@/components/ButtonRipple";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { DeferredModals } from "@/components/DeferredModals";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b3c68",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nawiratraders.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nawira Traders | Pakistan's #1 PTA-Approved Mobile Marketplace",
    template: "%s | Nawira Traders",
  },
  description:
    "Shop 100% PTA-Approved smartphones, tablets, keypad phones, and genuine mobile accessories in Pakistan with Open-Parcel Cash on Delivery and official 1-year brand warranty.",
  keywords: [
    "Nawira Traders",
    "Navira Traders",
    "PTA approved mobile phones Pakistan",
    "mobile prices in Pakistan",
    "Open Parcel COD mobile",
    "smartphones Rawalpindi",
    "Rania Mall Saddar mobile shop",
    "mobile installments Pakistan",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: siteUrl,
    siteName: "Nawira Traders",
    title: "Nawira Traders | Pakistan's #1 PTA-Approved Mobile Marketplace",
    description:
      "100% PTA-Approved smartphones, tablets, and accessories with Open-Parcel Cash on Delivery across Pakistan.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nawira Traders | Pakistan's #1 PTA-Approved Mobile Marketplace",
    description:
      "100% PTA-Approved smartphones, tablets, and accessories with Open-Parcel Cash on Delivery across Pakistan.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full antialiased overflow-x-hidden`}>
      <head>
        {/* Preconnect to external image CDNs & Google Fonts to eliminate DNS/TLS latency */}
        <link rel="preconnect" href="https://images.priceoye.pk" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.priceoye.pk" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
      </head>
      <body className="min-h-full flex flex-col bg-[#f1f3f6] text-[#0f1111] font-sans overflow-x-hidden w-full max-w-full">
        <AuthProvider>
          <AnalyticsTracker />
          <ButtonRipple />
          {children}
          <DeferredModals />
          <WhatsAppFloatingButton />
          <ScrollToTopButton />
        </AuthProvider>
      </body>
    </html>
  );
}
