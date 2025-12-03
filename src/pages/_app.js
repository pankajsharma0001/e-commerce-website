// pages/_app.js
import "@/styles/globals.css";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import { CartProvider } from "@/context/CartContext";
import { SessionProvider } from "next-auth/react";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const hideNavbar = router.pathname === '/admin-login';
  
  return (
    <SessionProvider 
      session={session}
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      <CartProvider>
        {!hideNavbar && <Navbar />}
        <Analytics />
        <SpeedInsights />
        <Component {...pageProps} />
      </CartProvider>
    </SessionProvider>
  );
}