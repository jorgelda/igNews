import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { query as q } from "faunadb";
import { fauna } from "../../../services/fauna";

export const authOptions = {
  secret: process.env.NEXTAUTH_URL,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret:
        process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user",
        },
      },
    }),
  ],
  callbacks: {
    async signIn(data: any) {
      const { email } = data.user;

      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(
                  q.Index("user_by_email"),
                  q.Casefold(email)
                )
              )
            ),
            q.Create(q.Collection("users"), {
              data: { email },
            }),
            q.Get(
              q.Match(
                q.Index("user_by_email"),
                q.Casefold(email)
              )
            )
          )
        );
        return true;
      } catch (error) {
        return false;
      }
    },
  },
};
export default NextAuth(authOptions);
