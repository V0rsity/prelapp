import "../styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "../context/AuthContext";
import Head from "next/head";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <>
        <Head>
          {/* PWA Meta */}
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/icons/icon-192x192.png" />
          <meta name="theme-color" content="#BDDDFC" />
          <meta name="description" content="Track your readiness metrics and Strava runs." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />

          {/* iOS support */}
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </Head>

        <Component {...pageProps} />
      </>
    </AuthProvider>
  );
}

// To start npm run dev