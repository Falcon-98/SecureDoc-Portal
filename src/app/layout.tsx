import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureDoc Portal - Confidential Document Sharing",
  description: "Securely share confidential documents with encrypted links and view-only access",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <div className="bg-mesh"></div>
        <div className="noise"></div>
        {children}
      </body>
    </html>
  );
}
