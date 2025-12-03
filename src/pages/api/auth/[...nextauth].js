import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "../../../lib/mongodb";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const client = await clientPromise;
          const db = client.db("store");
          
          // Find user by email
          const user = await db.collection("users").findOne({
            email: credentials.email
          });

          if (!user) {
            throw new Error("No user found with this email");
          }

          // Compare passwords
          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            throw new Error("Invalid password");
          }

          // Return user object (without password)
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image || null,
            mobile: user.mobile || null
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.mobile = user.mobile;
      }
      
      // Google OAuth - save/update user in database
      if (account?.provider === "google" && user) {
        const client = await clientPromise;
        const db = client.db("store");
        
        const existingUser = await db.collection("users").findOne({
          email: user.email
        });

        if (!existingUser) {
          // Create new user for Google sign-in
          await db.collection("users").insertOne({
            name: user.name,
            email: user.email,
            image: user.image,
            provider: "google",
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else if (!existingUser.image && user.image) {
          // Update existing user with Google image if missing
          await db.collection("users").updateOne(
            { email: user.email },
            { $set: { image: user.image, updatedAt: new Date() } }
          );
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.image;
        session.user.mobile = token.mobile;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For Google users, ensure image is saved
      if (account?.provider === "google") {
        try {
          const client = await clientPromise;
          const db = client.db("store");
          
          // Check if user exists
          const existingUser = await db.collection("users").findOne({
            email: user.email
          });

          if (existingUser) {
            // Update user with Google image if missing
            if (!existingUser.image && user.image) {
              await db.collection("users").updateOne(
                { email: user.email },
                { $set: { image: user.image, updatedAt: new Date() } }
              );
            }
          }
        } catch (error) {
          console.error("Error in signIn callback:", error);
        }
      }
      return true;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);