import MenuItemCard, { type MenuItem } from '@/components/menu-item-card'
import { createSupabaseServer } from '@/lib/supabase/server'

export const revalidate = 0 // always fresh for now

function catId(cat: string) {
  return `cat-${encodeURIComponent(cat.replace(/\s+/g, '-').toLowerCase())}`
}

export default async function MenuPage() {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('menu_items')
    .select('id,name,description,image_url,price_cents,category')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load menu: {error.message}
        </div>
      </section>
    )
  }

  const items = (data ?? []) as MenuItem[]
  const categories = Array.from(new Set(items.map(i => i.category)))
  const byCat = new Map<string, MenuItem[]>()
  for (const c of categories) byCat.set(c, items.filter(i => i.category === c))

  return (
    <section className="mx-auto max-w-6xl px-4">
      {/* Page header */}
      <div className="py-6">
        <h1 className="text-2xl font-semibold">Menu</h1>
        <p className="mt-1 text-sm text-zinc-600">{items.length} items available</p>
      </div>

      {/* Sticky category bar */}
      {categories.length > 0 && (
        <div className="sticky top-14 z-10 -mx-4 mb-6 border-b bg-white/80 px-4 py-3 backdrop-blur">
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <a
                key={c}
                href={`#${catId(c)}`}
                className="rounded-full border px-3 py-1 text-sm text-zinc-800 hover:bg-zinc-50"
              >
                {c}
                <span className="ml-1 text-zinc-500">
                  ({byCat.get(c)?.length ?? 0})
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      {categories.map(cat => {
        const list = byCat.get(cat) ?? []
        return (
          <div key={cat} id={catId(cat)} className="scroll-mt-24">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{cat}</h2>
              <a
                href="#"
                className="text-sm text-zinc-600 underline-offset-4 hover:underline"
              >
                Back to top
              </a>
            </div>

            {list.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {list.map(i => (
                  <MenuItemCard key={i.id} item={i} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">No items in this category yet.</p>
            )}

            <div className="my-8 border-t" />
          </div>
        )
      })}

      {categories.length === 0 && (
        <div className="rounded-md border bg-white p-6 text-center">
          <p className="text-sm text-zinc-600">No items yet.</p>
        </div>
      )}
    </section>
  )
}