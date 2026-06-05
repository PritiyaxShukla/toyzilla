import "./globals.css";
import { Inter, Poppins } from "next/font/google";
import { StoreProvider } from "./providers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://toyzilla.example";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Toyzilla — Online Toy Store",
    template: "%s · Toyzilla",
  },
  description:
    "India's friendliest toy store. Safe, fun toys delivered to your door.",
  keywords: ["toys", "kids toys", "online toy store", "India", "Toyzilla"],
  applicationName: "Toyzilla",
  openGraph: {
    type: "website",
    siteName: "Toyzilla",
    title: "Toyzilla — Online Toy Store",
    description:
      "India's friendliest toy store. Safe, fun toys delivered to your door.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Toyzilla — Online Toy Store",
    description: "India's friendliest toy store.",
  },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦖</text></svg>",
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans min-h-screen flex flex-col bg-[#f6f7f9]">
        <StoreProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
