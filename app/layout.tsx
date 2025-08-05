import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weather Dashboard",
  description: "Weather dashboard with Open Meteo API integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="/css/leaflet.css"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
