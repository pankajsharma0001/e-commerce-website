// pages/_app.js
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import { CartProvider } from "@/context/CartContext";
import { SessionProvider } from "next-auth/react";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <CartProvider>
        <Navbar />             {/* ✅ Now Navbar has access to useCart */}
        <Component {...pageProps} />
      </CartProvider>
    </SessionProvider>
  );
}
