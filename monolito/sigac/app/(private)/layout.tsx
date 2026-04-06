import RequireAuth from '@/components/RequireAuth';
import PrivateNav from '@/components/PrivateNav';

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
        <PrivateNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </RequireAuth>
  );
}
