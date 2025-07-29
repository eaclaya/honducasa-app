"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Session } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AuthNav() {
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
        <ul className="flex items-center gap-8 p-4">
          <li>
            <Link href="/properties">Properties</Link>
          </li>
          <li>
            <Link href="/properties/create"><Button>Post Property</Button></Link>
          </li>
        </ul>
      ) : (
        null
      )}
    </div>
  )
}
