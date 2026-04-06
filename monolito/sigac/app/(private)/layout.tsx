import RequireAuth from '@/components/RequireAuth';
import PrivateNav from '@/components/PrivateNav';

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="app-shell text-zinc-100">
        <PrivateNav />
        <main className="app-main ui-fade-in-delayed">{children}</main>
      </div>
    </RequireAuth>
  );
}
