// pages/_app.js
import "@/styles/globals.css";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import { CartProvider } from "@/context/CartContext";
import { SessionProvider } from "next-auth/react";

// Create a wrapper component that uses the router
function MyAppContent({ Component, pageProps, session }) {
  const router = useRouter();
  const hideNavbar = router.pathname === '/admin-login';
  
  return (
    <SessionProvider session={session}>
      <CartProvider>
        {!hideNavbar && <Navbar />}
        <Component {...pageProps} />
      </CartProvider>
    </SessionProvider>
  );
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  // Note: The router won't be available during SSR for the initial page
  // But this will work for client-side navigation
  return <MyAppContent Component={Component} pageProps={pageProps} session={session} />;
}