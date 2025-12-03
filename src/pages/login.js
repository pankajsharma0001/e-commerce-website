import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push(router.query.redirect || "/dashboard");
    }
  }, [status, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn("google", {
        callbackUrl: router.query.redirect || "/dashboard"
      });
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Registration flow
        if (!name || !email || !password || !mobile) {
          throw new Error("Please fill all fields");
        }

        // Register user
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, mobile })
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          throw new Error(registerData.error || "Registration failed");
        }

        // Auto login after registration
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false
        });

        if (signInResult?.error) {
          throw new Error(signInResult.error || "Login failed after registration");
        }

        router.push(router.query.redirect || "/dashboard");
      } else {
        // Login flow
        if (!email || !password) {
          throw new Error("Please fill all fields");
        }

        // Sign in with credentials
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: router.query.redirect || "/dashboard"
        });

        if (result?.error) {
          if (result.error.includes("No user found")) {
            throw new Error("No account found with this email");
          } else if (result.error.includes("Invalid password")) {
            throw new Error("Incorrect password");
          }
          throw new Error(result.error || "Login failed");
        }

        // Successful login
        router.push(router.query.redirect || "/dashboard");
      }
    } catch (err) {
      setError(err.message);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-sans relative overflow-hidden">
      {/* Background glow circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

      {/* Login Card */}
      <div
        className={`w-full max-w-md p-10 bg-white rounded-3xl shadow-2xl text-center relative z-10 transition-transform ${
          shake ? "animate-shake" : ""
        }`}
      >
        <h1 className="text-4xl font-extrabold text-indigo-600 mb-4">JK Mega Mart</h1>
        <p className="text-gray-600 mb-8">
          {isSignUp ? "Create your account" : "Sign in to your account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 text-left mb-6">
          {isSignUp && (
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full p-3 text-gray-600 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full p-3 border-2 text-gray-600 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
              disabled={loading}
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Mobile Number</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+977 9800000000"
                className="w-full p-3 border-2 text-gray-600 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-3 text-gray-600 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {loading ? (isSignUp ? "Creating Account..." : "Logging in...") : (isSignUp ? "Sign Up" : "Login")}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 border-2 border-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Loading..." : "Continue with Google"}
        </button>

        <p className="text-center text-gray-600 mt-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setName("");
              setMobile("");
              setEmail("");
              setPassword("");
            }}
            className="text-indigo-600 font-bold hover:underline focus:outline-none"
            disabled={loading}
          >
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>

      <style jsx>{`
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}