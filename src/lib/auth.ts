import type { NextAuthOptions, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

const ADMIN_EMAIL = "surajbehera1011@gmail.com";
const ADMIN_PASSWORD = "Cricket@123";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();

        if (email === ADMIN_EMAIL && credentials.password === ADMIN_PASSWORD) {
          const user = await prisma.user.upsert({
            where: { email: ADMIN_EMAIL },
            update: { role: UserRole.ADMIN },
            create: { email: ADMIN_EMAIL, displayName: "Tournament Admin", role: UserRole.ADMIN, password: "" },
          });
          return { id: user.id, email: user.email, name: user.displayName, role: user.role };
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== UserRole.CAPTAIN) return null;
        if (user.password !== credentials.password) return null;

        return { id: user.id, email: user.email, name: user.displayName, role: user.role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      return { ...session, user: { ...session.user, id: token.id, role: token.role } };
    },
  },
};
