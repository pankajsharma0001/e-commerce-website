// pages/login.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";

export default function Login() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user logged in via Google
  useEffect(() => {
    if (session?.user) {
      // Store Google user in localStorage
      localStorage.setItem("user", JSON.stringify({
        id: Date.now(),
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      }));
      // Redirect to dashboard
      router.push("/dashboard");
    }
  }, [session, router]);

  // Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      console.error(err);
      setError("Google login failed");
      setLoading(false);
    }
  };

  // Email/Password Login or SignUp
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name || !email || !password || !mobile) {
          setError("Please fill all fields");
          setLoading(false);
          return;
        }

        const newUser = { id: Date.now(), name, email, password, mobile };
        const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");

        if (existingUsers.some(u => u.email === email)) {
          setError("Email already registered");
          setLoading(false);
          return;
        }

        existingUsers.push(newUser);
        localStorage.setItem("users", JSON.stringify(existingUsers));
        localStorage.setItem("user", JSON.stringify({ id: newUser.id, name: newUser.name, email: newUser.email, mobile: newUser.mobile }));
        router.push("/dashboard");
      } else {
        if (!email || !password) {
          setError("Please fill all fields");
          setLoading(false);
          return;
        }

        const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
        const user = existingUsers.find(u => u.email === email && u.password === password);

        if (!user) {
          setError("Invalid email or password");
          setLoading(false);
          return;
        }

        localStorage.setItem("user", JSON.stringify({ id: user.id, name: user.name, email: user.email }));
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
      
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl text-center relative z-10">
        <h1 className="text-4xl font-bold text-indigo-600 mb-6">MyStore</h1>

        <p className="text-gray-600 mb-6">{isSignUp ? "Create a new account" : "Welcome back"}</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left mb-6">
          {isSignUp && (
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Mobile Number</label>
              <input
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="Enter your mobile number"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-bold rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Login"}
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

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition disabled:opacity-50 mb-4"
        >
          <span className="text-xl font-bold text-blue-600">G</span>
          {loading ? "Loading..." : "Continue with Google"}
        </button>

        <p className="text-center text-gray-600 mt-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="text-indigo-600 font-bold hover:underline"
          >
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
