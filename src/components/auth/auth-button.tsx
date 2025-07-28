"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { Session } from "@supabase/supabase-js"
import { ProfileMenu } from "./profile-menu"

export function AuthButton() {
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="flex items-center space-x-4">
      {session?.user ? (
        <ProfileMenu />
      ) : (
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      )}
    </div>
  )
}
