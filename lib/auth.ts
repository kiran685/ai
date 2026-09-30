import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        isSignUp: { label: "isSignUp", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = credentials.email.trim().toLowerCase();
        const isSignUp = credentials.isSignUp === "true";

        if (isSignUp) {
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            throw new Error("An account with this email already exists");
          }

          const hashedPassword = await bcrypt.hash(credentials.password, 12);
          const name = credentials.name?.trim() || email.split("@")[0];

          const user = await prisma.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
            },
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            onboardingCompleted: false,
            emailVerified: false,
          };
        }

        // Standard sign-in flow
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          onboardingCompleted: user.onboardingCompleted ?? false,
          emailVerified: !!user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.id = user.id;
        token.onboardingCompleted = (user as { onboardingCompleted?: boolean }).onboardingCompleted ?? false;
        token.emailVerified = (user as { emailVerified?: boolean }).emailVerified ?? false;
      } else if (token.userId) {
        // Refresh onboarding status and email verification from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { onboardingCompleted: true, emailVerified: true },
        });
        if (dbUser) {
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.emailVerified = !!dbUser.emailVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.userId || token.id) as string;
        (session.user as { onboardingCompleted?: boolean }).onboardingCompleted =
          token.onboardingCompleted as boolean ?? false;
        (session.user as { emailVerified?: boolean }).emailVerified =
          token.emailVerified as boolean ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "ai_career_os_super_secret_jwt_key_2026_auth",
};
