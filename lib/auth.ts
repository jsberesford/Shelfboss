import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import type { Role } from "@prisma/client";

const devProviders =
  (process.env.NODE_ENV as string) === "development"
    ? [
        Credentials({
          id: "dev-login",
          name: "Dev Login",
          credentials: {
            email: { label: "Email", type: "text" },
            role: { label: "Role", type: "text" },
          },
          async authorize(credentials) {
            const email = credentials?.email as string;
            const role = (credentials?.role as Role) ?? "SUPER_ADMIN";
            if (!email) return null;

            let user = await db.user.findUnique({ where: { email } });
            if (!user) {
              user = await db.user.create({
                data: {
                  email,
                  name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                  role,
                },
              });
            }
            return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
          },
        }),
      ]
    : [];

const azureProvider =
  process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID
    ? [
        MicrosoftEntraID({
          clientId: process.env.AZURE_AD_CLIENT_ID,
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
          issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
          authorization: {
            params: { scope: "openid profile email User.Read" },
          },
        }),
      ]
    : [];

const DEV_SESSION = {
  user: { id: "dev", name: "Dev User", email: "dev@localhost", image: null, role: "SUPER_ADMIN" as Role },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // JWT strategy is required when using Credentials provider alongside an adapter
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [...azureProvider, ...devProviders],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // On sign-in, embed id and role into the token
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    async signIn({ user }) {
      if (user.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          select: { active: true },
        });
        if (dbUser && !dbUser.active) return false;
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export async function getSession() {
  const session = await auth();
  if ((process.env.NODE_ENV as string) === "development" && !session) return DEV_SESSION;
  return session;
}
