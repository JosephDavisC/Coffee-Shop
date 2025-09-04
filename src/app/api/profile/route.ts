// src/app/api/profile/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({} as any))
  const full_name = (body.full_name ?? '').toString().trim()

  if (!full_name) {
    return NextResponse.json({ error: 'Full name required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

// Optional: support POST from a regular <form method="post">
export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const form = await req.formData()
  const full_name = (form.get('full_name') ?? '').toString().trim()

  if (!full_name) {
    return NextResponse.redirect(new URL('/profile?error=empty', req.url))
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name })
    .eq('id', user.id)

  if (error) {
    return NextResponse.redirect(
      new URL(`/profile?error=${encodeURIComponent(error.message)}`, req.url)
    )
  }

  return NextResponse.redirect(new URL('/profile?updated=1', req.url))
}