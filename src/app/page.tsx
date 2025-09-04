import Image from 'next/image';
import Link from 'next/link';
import Container from '@/components/container';
import { Coffee, Clock, CreditCard, MapPin } from 'lucide-react';

export default async function HomePage() {
  // If you already compute categories/featured, keep your logic.
  const categories = [
    { key: 'Espresso', href: '/menu#cat-Espresso' },
    { key: 'Milk', href: '/menu#cat-Milk' },
    { key: 'Pastry', href: '/menu#cat-Pastry' },
    { key: 'Tea', href: '/menu#cat-Tea' },
  ];

  return (
    <>
      {/* Hero */}
      <Container className="py-10 md:py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Your daily coffee, done right.
            </h1>
            <p className="text-zinc-600">
              Order ahead, skip the line, and enjoy fresh espresso and pastries.
            </p>
            <div className="flex gap-2">
              <Link href="/menu" className="rounded-md bg-black px-4 py-2 text-white hover:bg-zinc-900">
                Order now
              </Link>
              <Link href="/bookings" className="rounded-md border px-4 py-2 hover:bg-zinc-50">
                Book a table
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map((c) => (
                <Link
                  key={c.key}
                  href={c.href}
                  className="rounded-full border px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  {c.key}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border">
            <Image
              src="/coffee-hero.jpg"
              alt="coffee hero"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
            />
          </div>
        </div>
      </Container>

      {/* Feature row */}
      <Container className="grid gap-4 py-8 md:grid-cols-3">
        <Feature icon={<Clock className="h-5 w-5" />} title="Ready when you are" text="Order ahead and pick up fast." />
        <Feature icon={<CreditCard className="h-5 w-5" />} title="Secure checkout" text="Cards, wallets, Cash App Pay." />
        <Feature icon={<MapPin className="h-5 w-5" />} title="City center" text="Easy access, cozy seating." />
      </Container>

      {/* Popular categories grid */}
      <Container className="py-6">
        <h2 className="mb-4 text-lg font-semibold">Popular picks</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {['Americano', 'Latte', 'Cappuccino', 'Espresso'].map((name) => (
            <Link
              key={name}
              href="/menu"
              className="group rounded-lg border p-4 hover:border-black"
            >
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                <span className="font-medium">{name}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">Barista favorites</p>
              <div className="mt-3 h-24 w-full rounded-md bg-[url('/coffee-hero.jpg')] bg-cover bg-center opacity-90 transition group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </Container>

      {/* CTA strip */}
      <div className="mt-10 border-y bg-zinc-50">
        <Container className="flex flex-col items-center gap-3 py-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h3 className="text-lg font-semibold">Grab & go, without the wait</h3>
            <p className="text-sm text-zinc-600">Tap “Order now”, we’ll text you when it’s ready.</p>
          </div>
          <Link href="/menu" className="rounded-md bg-black px-4 py-2 text-white hover:bg-zinc-900">
            Order now
          </Link>
        </Container>
      </div>
    </>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 inline-flex items-center justify-center rounded-md bg-zinc-100 p-2 text-zinc-800">
        {icon}
      </div>
      <div className="font-medium">{title}</div>
      <div className="text-sm text-zinc-600">{text}</div>
    </div>
  );
}