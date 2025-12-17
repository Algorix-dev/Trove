import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Trove - Your Personal Reading Companion",
    template: "%s | Trove",
  },
  description: "Track your reading progress, manage your digital library, take notes, and build lasting reading habits. Upload your own e-books and read anywhere.",
  keywords: ["reading tracker", "ebook reader", "digital library", "reading app", "book management", "reading notes", "reading analytics"],
  authors: [{ name: "Trove" }],
  creator: "Trove",
  publisher: "Trove",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env['NEXT_PUBLIC_SITE_URL'] || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Trove - Your Personal Reading Companion",
    description: "Track your reading progress, manage your digital library, take notes, and build lasting reading habits.",
    siteName: "Trove",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trove - Your Personal Reading Companion",
    description: "Track your reading progress, manage your digital library, take notes, and build lasting reading habits.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={cn(inter.className, "min-h-screen bg-background font-sans antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
