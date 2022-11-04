import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { Profile } from 'next-auth'
const id = process.env.GITHUB_ID as string
const secret = process.env.GITHUB_SECRET as string
export default NextAuth({
  providers: [
    GithubProvider({
      clientId: id,
      clientSecret: secret,
      authorization: { params: { scope: 'read:user' } }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        return true
      } catch (err) {
        console.log('DEU ERRO', err)
        return false
      }
    },
    async session({ session, token, user }) {
      try {
        return {
          ...session,
          id: session.user?.name
        }
      } catch {
        return {
          ...session,
          id: null
        }
      }
    }
  }
})

