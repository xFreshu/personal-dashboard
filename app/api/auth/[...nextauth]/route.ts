import NextAuth, { NextAuthOptions } from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

type ExtendedToken = JWT & {
  accessToken?: string;
  accessTokenExpires: number;
  refreshToken?: string;
  error?: string;
};

type SessionWithAccessToken = Session & {
  accessToken?: string;
  error?: string;
};

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: ExtendedToken): Promise<ExtendedToken> {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken ?? "",
      });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = (await response.json()) as GoogleTokenResponse;

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error(error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      const currentToken = token as ExtendedToken;

      // Przy pierwszym logowaniu
      if (account && user) {
        return {
          ...currentToken,
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
          refreshToken: account.refresh_token,
        } satisfies ExtendedToken;
      }

      // Jeżeli token jest wciąż ważny (np. dodajemy mały bufor 1 minuty)
      if (Date.now() < currentToken.accessTokenExpires - 60 * 1000) {
        return currentToken;
      }

      // Zwróć nowy, odświeżony token
      return refreshAccessToken(currentToken);
    },
    async session({ session, token }) {
      const nextSession = session as SessionWithAccessToken;
      const nextToken = token as ExtendedToken;

      // Przekazujemy access token i ewentualne błędy do obiektu sesji
      nextSession.accessToken = nextToken.accessToken;
      nextSession.error = nextToken.error;
      return nextSession;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
