import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { AUTH_ERROR_MESSAGE, generateInviteCode, isValidOtp, normalizeIdentifier, normalizeText } from "@/lib/security"
import { isValidUsername } from "@/lib/validators"

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
        const email = normalizeIdentifier(credentials?.email, 254);
        const otp = normalizeText(credentials?.otp, 6);
        const action = normalizeText(credentials?.action, 16);
        const name = normalizeText(credentials?.name, 80);
        const username = normalizeIdentifier(credentials?.username, 24);
        const country = normalizeText(credentials?.country, 80);

        if (!email || !isValidOtp(otp)) {
          throw new Error(AUTH_ERROR_MESSAGE)
        }

        const dbOtp = await prisma.otp.findUnique({
          where: { email }
        });
        if (!dbOtp || dbOtp.code !== otp || dbOtp.expiresAt < new Date()) {
          throw new Error(AUTH_ERROR_MESSAGE);
        }

        await prisma.otp.delete({ where: { email } });

        let user;

        if (action === 'signup') {
          if (!username || !isValidUsername(username)) {
            throw new Error("Invalid username");
          }

          const existingByEmail = await prisma.user.findUnique({ where: { email } });
          if (existingByEmail) {
            throw new Error("Account already exists");
          }

          const usernameBase = username.slice(0, 20);
          let finalUsername = username;
          while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
            finalUsername = `${usernameBase}${generateInviteCode().slice(0, 4)}`;
          }

          user = await prisma.user.create({
            data: {
              email,
              name: name || email.split('@')[0],
              username: finalUsername,
              country: country || "",
              verified: true,
              isPrivate: true
            }
          })
        } else {
          if (action !== 'login') {
            throw new Error(AUTH_ERROR_MESSAGE);
          }

          user = await prisma.user.findUnique({ where: { email } })
          if (!user) throw new Error(AUTH_ERROR_MESSAGE)
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
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 12,
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
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

          const newUser = await prisma.user.create({
            data: {
              email: token.email,
              name: token.name || 'User',
              username: finalUsername,
              verified: true,
              isPrivate: true
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
        (session.user as { id?: string }).id = typeof token.id === 'string' ? token.id : undefined;
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  }
}
