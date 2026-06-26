import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Search,
  Settings,
  Trophy,
} from "lucide-react";

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/courses" className="flex items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-fg">
            <GraduationCap size={16} />
          </span>
          StudyForge
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/courses" icon={<BookOpen size={15} />} label="Courses" />
          <NavLink href="/search" icon={<Search size={15} />} label="Search" />
          <NavLink href="/study" icon={<GraduationCap size={15} />} label="Study" />
          <NavLink href="/analytics" icon={<BarChart3 size={15} />} label="Stats" />
          <NavLink href="/progress" icon={<Trophy size={15} />} label="Progress" />
          <NavLink href="/settings" icon={<Settings size={15} />} label="Settings" />
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
