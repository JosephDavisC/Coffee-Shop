'use client'

import { useState, FormEvent } from 'react'
import { toast } from 'sonner'

export default function ProfileForm({ initialName }: { initialName: string }) {
  const [fullName, setFullName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!dirty || !fullName.trim()) return
    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim() }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Request failed')
      }

      toast.success('Profile updated')
      setDirty(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <label
          htmlFor="full_name"
          className="mb-1 block text-xs font-medium text-zinc-500"
        >
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value)
            setDirty(true)
          }}
          placeholder="Your name"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !dirty || !fullName.trim()}
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
      >
        {saving ? 'Saving…' : !dirty ? '✓ Saved' : 'Save'}
      </button>
    </form>
  )
}