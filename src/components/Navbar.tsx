import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Menu, X, Stethoscope } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language";

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/timeline", label: t.nav.liveProgram },
    { to: "/partners", label: t.nav.partners },
    { to: "/clubs", label: t.nav.postCoffee },
    { to: "/organizers", label: t.nav.organizers },
    { to: "/portfolio", label: t.nav.portfolio },
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="glass border-b border-border/50">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-base tracking-tight">MedConf</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">2026 · Global</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-colors",
                  pathname === l.to
                    ? "text-secondary"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                {pathname === l.to && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-secondary/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-full">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.div>
              </AnimatePresence>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full border border-border/60"
              onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              aria-label="Toggle language"
            >
              {t.languageToggle}
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
                <motion.nav
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="lg:hidden overflow-hidden border-t border-border/50"
                >
                  <div className="container py-3 flex flex-col gap-1">
                    {links.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      pathname === l.to
                        ? "bg-secondary/10 text-secondary"
                        : "hover:bg-muted"
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
