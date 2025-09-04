import Container from '@/components/container';
import { createSupabaseServer } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const supabase = await createSupabaseServer();

  const since = new Date(); since.setHours(0,0,0,0);

  const { data: today } = await supabase
    .from('orders')
    .select('amount_cents,status')
    .gte('created_at', since.toISOString());

  const paid = (today ?? []).filter(o => o.status === 'paid');
  const pending = (today ?? []).filter(o => o.status === 'pending');

  const sum = (list: any[]) => list.reduce((n, o) => n + (o.amount_cents ?? 0), 0);

  return (
    <Container className="py-8">
      <h1 className="mb-4 text-xl font-semibold">Admin · Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Today revenue" value={sum(paid) / 100} prefix="$" />
        <Stat title="Paid orders" value={paid.length} />
        <Stat title="Pending orders" value={pending.length} />
        <Stat title="All orders today" value={(today ?? []).length} />
      </div>

      <div className="mt-8 rounded-lg border bg-white">
        <iframe
          className="h-[70vh] w-full"
          src="/admin/orders?status=all"
        />
      </div>
    </Container>
  );
}

function Stat({ title, value, prefix = '' }: { title: string; value: number; prefix?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-zinc-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{prefix}{value.toLocaleString()}</div>
    </div>
  );
}