// src/app/orders/thanks/page.tsx
import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

type SP = { [key: string]: string | string[] | undefined };

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  // read params from Stripe redirect
  const orderId = searchParams.order as string | undefined;
  const paymentIntent = searchParams.payment_intent as string | undefined;

  const supabase = await createSupabaseServer();

  let order: any = null;
  if (orderId) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    order = data;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Thanks for your order!</h1>
      <p className="mt-2 text-muted-foreground">
        We’re getting it ready.{" "}
        {paymentIntent && (
          <a
            href={`https://dashboard.stripe.com/test/payments/${paymentIntent}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 text-primary"
          >
            View in Stripe
          </a>
        )}
      </p>

      {order ? (
        <div className="mt-6 rounded-md border p-4">
          <p>
            <strong>Order ID:</strong> {order.id}
          </p>
          <p>
            <strong>Placed:</strong>{" "}
            {new Date(order.created_at).toLocaleString()}
          </p>
          <p>
            <strong>Total:</strong>{" "}
            {(order.amount_cents / 100).toLocaleString("en-US", {
              style: "currency",
              currency: (order.currency || "USD").toUpperCase(),
            })}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={[
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                order.status === "paid"
                  ? "bg-green-100 text-green-700"
                  : order.status === "failed"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700",
              ].join(" ")}
            >
              {order.status}
            </span>
          </p>
        </div>
      ) : (
        <p className="mt-6 rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
          We couldn’t find that order.{" "}
          <Link href="/orders" className="underline">
            See your orders →
          </Link>
        </p>
      )}

      <div className="mt-8 flex gap-4">
        <Link
          href="/orders"
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          View all orders
        </Link>
        <Link
          href="/menu"
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Back to menu
        </Link>
      </div>
    </div>
  );
}