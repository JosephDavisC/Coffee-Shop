import './globals.css';
import Navbar from '@/components/navbar';
import Container from '@/components/container';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-zinc-900">
        <Navbar />
        <main>
          {children}
        </main>
        <footer className="mt-14 border-t">
          <Container className="flex h-16 items-center justify-between text-sm text-zinc-600">
            <span>© {new Date().getFullYear()} Coffee Shop</span>
            <span>Open daily · 7am–6pm</span>
          </Container>
        </footer>
      </body>
    </html>
  );
}