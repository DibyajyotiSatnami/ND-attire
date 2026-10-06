import type { Metadata, Viewport } from "next";
import { Mukta, Young_Serif } from "next/font/google";
import { Header } from "@/components/Header";
import { Announcement } from "@/components/Announcement";
import { Footer } from "@/components/Footer";
import { BagDrawer } from "@/components/BagDrawer";
import { FlyToBag } from "@/components/FlyToBag";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Providers } from "@/components/Providers";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/config/site";
import "./globals.css";

const display = Young_Serif({ weight: "400", subsets: ["latin"], variable: "--font-young-serif", display: "swap" });
const body = Mukta({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-mukta", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "ND Attire · Handpainted mekhela sador and bridal dupattas",
    template: "%s · ND Attire",
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    title: "ND Attire · Handpainted mekhela sador and bridal dupattas",
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF5EA" },
    { media: "(prefers-color-scheme: dark)", color: "#1A120C" },
  ],
};

// Decide before first paint whether the hero intro plays (home, once per session, motion allowed).
const introScript = `try{var d=document.documentElement;if(location.pathname==="/"&&sessionStorage.getItem("nd-intro")!=="1"&&!matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.intro="play"}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ClothingStore",
            name: site.name,
            slogan: site.tagline,
            description: site.description,
            url: site.url,
            logo: `${site.url}/brand/logo-mark.png`,
            image: `${site.url}/opengraph-image.png`,
            founder: { "@type": "Person", name: site.founder, sameAs: site.founderInstagram },
            telephone: `+${site.whatsapp}`,
            sameAs: [site.instagram],
            ...(site.address ? { address: site.address } : {}),
          }}
        />
        <a
          href="#main"
          className="sr-only z-[70] rounded-full bg-maroon px-5 py-3 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <Providers>
          <Announcement />
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <BagDrawer />
          <FlyToBag />
          <WhatsAppFab />
        </Providers>
      </body>
    </html>
  );
}
