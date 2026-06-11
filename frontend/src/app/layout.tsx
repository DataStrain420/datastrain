import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "DataStrain — UK Medical Cannabis Reviews",
  description:
    "The trusted platform for UK medical cannabis strain reviews and discovery.",
  icons: {
    icon: "/brand/favicon.svg",
    apple: "/brand/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen text-white antialiased ${roboto.className}`}
        style={{ backgroundColor: "#14181b" }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
