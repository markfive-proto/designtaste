import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user session
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth status error:', error)
      return NextResponse.json({
        authenticated: false,
        user: null,
        error: error.message
      })
    }

    if (user) {
      // User is authenticated
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.name || user.email || 'User')}&size=32&background=3B82F6&color=fff`
        },
        session: {
          // Don't expose sensitive session data, just confirmation
          active: true
        }
      })
    } else {
      // User is not authenticated
      return NextResponse.json({
        authenticated: false,
        user: null
      })
    }
  } catch (error) {
    console.error('Auth status API error:', error)
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: 'Internal server error'
    }, { status: 500 })
  }
}