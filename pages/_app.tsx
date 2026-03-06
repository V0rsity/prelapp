import "../styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "../context/AuthContext";
import Head from "next/head";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <>
        <Head>
          {/* Google Fonts */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
          {/* PWA Meta */}
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/icons/icon-192x192.png" />
          <meta name="theme-color" content="#BDDDFC" key="theme-color" />
          <meta name="description" content="Track your readiness metrics and Strava runs." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />

          {/* iOS support */}
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </Head>

        <Component {...pageProps} />
      </>
    </AuthProvider>
  );
}

// To start npm run dev