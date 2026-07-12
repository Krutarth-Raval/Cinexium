import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy_secret",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: null,
        }
      }
    }),
    CredentialsProvider({
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "text" },
        otp: { label: "OTP", type: "text" },
        action: { label: "Action", type: "text" },
        name: { label: "Name", type: "text" },
        username: { label: "Username", type: "text" },
        country: { label: "Country", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          throw new Error("Missing email or OTP")
        }

        const { email, otp, action, name, username, country } = credentials

        // Verify OTP
        let isValidOtp = false;

        // Backdoor for Razorpay reviewer
        if (otp === "220119") {
          isValidOtp = true;
        } else {
          const dbOtp = await prisma.otp.findUnique({
            where: { email }
          });
          if (!dbOtp) throw new Error("OTP not found");
          if (dbOtp.code !== otp) throw new Error("Invalid OTP");
          if (dbOtp.expiresAt < new Date()) throw new Error("OTP expired");
          
          isValidOtp = true;
          // OTP is valid! Delete it so it can't be reused
          await prisma.otp.delete({ where: { email } });
        }

        let user;

        if (action === 'signup') {
          const existingUser = await prisma.user.findUnique({ where: { username: username || email } });
          const finalUsername = existingUser ? `${username}${Math.floor(Math.random() * 1000)}` : username;

          user = await prisma.user.create({
            data: {
              email,
              name: name || email.split('@')[0],
              username: finalUsername || email.split('@')[0],
              country: country || "",
              verified: true
            }
          })
        } else {
          // Login
          user = await prisma.user.findUnique({ where: { email } })
          if (!user) throw new Error("User not found")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email }
        })
        
        if (!dbUser) {
          const baseUsername = token.email.split('@')[0];
          let finalUsername = baseUsername;
          let counter = 1;
          
          while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
            finalUsername = `${baseUsername}${counter}`;
            counter++;
          }
          
          let detectedCountry = "US";
          try {
            const reqHeaders = await headers();
            detectedCountry = reqHeaders.get("x-vercel-ip-country") || "US";
          } catch (e) {
            console.error("Could not fetch headers for country detection", e);
          }

          const newUser = await prisma.user.create({
            data: {
              email: token.email,
              name: token.name || 'User',
              username: finalUsername,
              country: detectedCountry,
              verified: true
            }
          })
          token.id = newUser.id;
        } else {
          token.id = dbUser.id;
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
}
