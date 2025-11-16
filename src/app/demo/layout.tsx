
import { cn } from '@/lib/utils';

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="theme-free">{children}</div>;
}
