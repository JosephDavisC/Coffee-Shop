'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function AdminOrdersRealtime() {
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const ch = supabase
      .channel('orders-admin')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Simple approach: refresh the page on any change
          window.location.reload()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  return null
}