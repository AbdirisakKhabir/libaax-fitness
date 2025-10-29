// lib/auth.ts
import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { JWT } from 'next-auth/jwt';

const prisma = new PrismaClient();

// Extend the built-in User type to include our custom fields
interface CustomUser extends User {
  username: string;
  role: string;
}

// Extend the JWT type to include our custom fields
interface CustomJWT extends JWT {
  id?: string;
  username?: string;
  role?: string;
  exp?: number;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username
          }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id.toString(),
          username: user.username,
          role: user.role,
          name: user.username,
          email: `${user.username}@gym.com`
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 1 * 60 * 60, // 1 hour in seconds (3600 seconds)
  },
  jwt: {
    maxAge: 1 * 60 * 60, // 1 hour in seconds
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  callbacks: {
    async jwt({ token, user }): Promise<CustomJWT> {
      if (user) {
        const customUser = user as CustomUser;
        return {
          ...token,
          id: customUser.id,
          username: customUser.username,
          role: customUser.role,
          exp: Math.floor(Date.now() / 1000) + (1 * 60 * 60) // Set expiration to 1 hour
        };
      }
      
      // Check if token is expired - properly typed
      const customToken = token as CustomJWT;
      if (customToken.exp && Date.now() >= customToken.exp * 1000) {
        throw new Error('Token expired');
      }
      
      return customToken;
    },
    async session({ session, token }) {
      const customToken = token as CustomJWT;
      
      // Check if token is expired
      if (customToken.exp && Date.now() >= customToken.exp * 1000) {
        throw new Error('Session expired');
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: customToken.id as string,
          username: customToken.username as string,
          role: customToken.role as string
        },
        expires: new Date(Date.now() + (1 * 60 * 60 * 1000)).toISOString() // Set session expiration
      };
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  debug: process.env.NODE_ENV === 'development',
};