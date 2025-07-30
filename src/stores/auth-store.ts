import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      initialized: false,

      setUser: (user) => set({ user }),
      
      setSession: (session) => set({ 
        session, 
        user: session?.user ?? null 
      }),
      
      setLoading: (loading) => set({ loading }),

      initialize: async () => {
        if (get().initialized) return
        
        const supabase = createClient()
        
        try {
          // Get initial session
          const { data: { session } } = await supabase.auth.getSession()
          set({ 
            session, 
            user: session?.user ?? null, 
            loading: false,
            initialized: true 
          })

          // Listen for auth state changes
          supabase.auth.onAuthStateChange((_event, session) => {
            set({ 
              session, 
              user: session?.user ?? null, 
              loading: false 
            })
          })
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ loading: false, initialized: true })
        }
      },

      logout: async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        set({ user: null, session: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist user and session, not loading states
        user: state.user,
        session: state.session,
      }),
    }
  )
)