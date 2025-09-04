// src/app/orders/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

type OrderRow = {
  id: string;
  created_at: string;
  status: "pending" | "paid" | "failed" | string;
  amount_cents: number;
  currency: string | null;
  payment_intent_id: string | null;
};

function formatMoney(cents: number, currency = "usd") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
    }).format((cents ?? 0) / 100);
  } catch {
    return `$${(cents ?? 0 / 100).toFixed(2)}`;
  }
}

export const dynamic = "force-dynamic"; // show newest orders after redirect

export default async function OrdersPage() {
  const supabase = await createSupabaseServer();

  // Ensure user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // adjust if your login route is different
    redirect("/login");
  }

  // Fetch this user's orders (RLS should enforce ownership)
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, created_at, status, amount_cents, currency, payment_intent_id"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    // Lightweight error surface
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <p className="mt-6 rounded-md bg-red-50 text-red-700 p-3">
          Error loading orders: {error.message}
        </p>
      </div>
    );
  }

  const orders = (data ?? []) as OrderRow[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">My Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-md border p-6">
          <p className="text-sm text-muted-foreground">
            You don’t have any orders yet.
          </p>
          <Link
            href="/menu"
            className="mt-4 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Browse the menu →
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        o.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : o.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700",
                      ].join(" ")}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {formatMoney(o.amount_cents, o.currency ?? "usd")}
                  </td>
                  <td className="px-4 py-3">
                    {o.payment_intent_id ? (
                      <a
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline underline-offset-4"
                        href={`https://dashboard.stripe.com/test/payments/${o.payment_intent_id}`}
                      >
                        View in Stripe
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}