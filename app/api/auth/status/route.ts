import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        github: { connected: false },
        google: { connected: false },
      })
    }

    const user = await currentUser()
    
    // Check for GitHub OAuth account
    const githubAccount = user?.externalAccounts?.find(
      (account) => account.provider === "oauth_github"
    )
    
    // Check for Google OAuth account
    const googleAccount = user?.externalAccounts?.find(
      (account) => account.provider === "oauth_google"
    )

    return NextResponse.json({
      authenticated: true,
      userId,
      github: {
        connected: !!githubAccount,
        username: githubAccount?.username || null,
      },
      google: {
        connected: !!googleAccount,
        email: googleAccount?.emailAddress || null,
      },
    })
  } catch (error) {
    console.error("Error fetching auth status:", error)
    return NextResponse.json({
      authenticated: false,
      github: { connected: false },
      google: { connected: false },
    })
  }
}
