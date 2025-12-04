import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user");
    if (user) {
      // If logged in, go to dashboard
      router.push("/dashboard");
    } else {
      // If not logged in, go to login
      router.push("/products");
    }
  }, [router]);

  return null; // This page just redirects
}
