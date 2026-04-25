import { PropsWithChildren, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, CalendarClock, Coffee, FileText, Handshake, LayoutGrid, LogOut, UserRound, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearAdminSession, getAdminSession } from "./session";

const navItems = [
  { to: "/admin/overview", label: "Overview", icon: BarChart3 },
  { to: "/admin/live-program", label: "Live Program", icon: CalendarClock },
  { to: "/admin/program", label: "Program", icon: FileText },
  { to: "/admin/partners", label: "Our Partners", icon: Handshake },
  { to: "/admin/post-coffee", label: "Post Coffee", icon: Coffee },
  { to: "/admin/organizers", label: "Organizers", icon: UsersRound },
  { to: "/admin/portfolio", label: "Portfolio", icon: LayoutGrid },
  { to: "/admin/profile", label: "Profile", icon: UserRound },
] as const;

function Shell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid lg:grid-cols-[360px_1fr]">
        {children}
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const session = getAdminSession();
    if (!session || !session.adminId) navigate("/login", { replace: true });
  }, [navigate]);

  const session = typeof window !== "undefined" ? getAdminSession() : null;

  return (
    <Shell>
      <aside className="border-r border-border bg-card min-h-screen lg:sticky lg:top-0">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-border/60">
            <Link to="/" className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Admin</div>
                <div className="text-lg font-extrabold leading-tight">CureLink Live</div>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-gradient-secondary text-secondary-foreground font-extrabold flex items-center justify-center">
                CL
              </div>
            </Link>
            {session ? (
              <div className="mt-5 rounded-2xl bg-muted/40 border border-border/60 p-4">
                <div className="text-sm font-bold truncate">{session.fullName}</div>
                <div className="text-xs text-muted-foreground truncate">{session.email}</div>
              </div>
            ) : null}
          </div>

          <nav className="p-3 flex-1 overflow-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                    isActive ? "bg-secondary/15 text-secondary" : "hover:bg-muted",
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-secondary" : "text-muted-foreground")} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-6 border-t border-border/60">
            <Button
              variant="outline"
              className="w-full rounded-2xl"
              onClick={() => {
                clearAdminSession();
                navigate("/login", { replace: true });
              }}
            >
              Sign out
              <LogOut />
            </Button>
          </div>
        </div>
      </aside>

      <section className="min-w-0 px-4 md:px-8 py-6 lg:py-8">
        <div className="mb-7 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Admin dashboard</div>
            <div className="text-2xl md:text-3xl font-extrabold truncate">
              {navItems.find((i) => i.to === pathname)?.label ?? "Overview"}
            </div>
          </div>
          <Button asChild variant="secondary" className="rounded-2xl">
            <a href="/" target="_self" rel="noreferrer">
              View site
            </a>
          </Button>
        </div>

        <Outlet />
      </section>
    </Shell>
  );
}
