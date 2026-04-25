import { Stethoscope, Mail, Twitter, Linkedin, Instagram, Facebook } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/language";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground mt-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-40" />
      <div className="container relative py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-secondary flex items-center justify-center shadow-glow">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="font-bold text-xl">MedConf 2026</div>
          </div>
          <p className="text-primary-foreground/70 max-w-md text-sm leading-relaxed">{t.footer.description}</p>
          <div className="flex gap-3 mt-6">
            <a
              href="https://www.linkedin.com/company/new-era-club/"
              className="h-10 w-10 rounded-xl glass flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-colors"
              aria-label="LinkedIn"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="https://web.facebook.com/profile.php?id=61583732851117"
              className="h-10 w-10 rounded-xl glass flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-colors"
              aria-label="Facebook"
              target="_blank"
              rel="noreferrer"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/new.eraclub3/"
              className="h-10 w-10 rounded-xl glass flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-colors"
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="mailto:jmc.facmed.ogx2025@gmail.com"
              className="h-10 w-10 rounded-xl glass flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-4">{t.footer.conference}</div>
          <ul className="space-y-2.5 text-sm text-primary-foreground/80">
            <li><Link to="/timeline" className="hover:text-secondary-glow transition-colors">{t.nav.liveProgram}</Link></li>
            <li><Link to="/partners" className="hover:text-secondary-glow transition-colors">{t.nav.partners}</Link></li>
            <li><Link to="/clubs" className="hover:text-secondary-glow transition-colors">{t.nav.postCoffee}</Link></li>
            <li><Link to="/organizers" className="hover:text-secondary-glow transition-colors">{t.nav.organizers}</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-4">{t.footer.contact}</div>
          <ul className="space-y-2.5 text-sm text-primary-foreground/80">
            <li>jmc.facmed.ogx2025@gmail.com</li>
            <li>08-09 May 2026</li>
            <li>Amphitheatre de l'universite KASDI Merbah<br/>Ouargla</li>
          </ul>
        </div>
      </div>
      <div className="container relative border-t border-white/10 py-6 text-xs text-primary-foreground/60 flex flex-wrap justify-between gap-3">
        <span>{t.footer.rights}</span>
        <span>{t.footer.crafted}</span>
      </div>
    </footer>
  );
}
