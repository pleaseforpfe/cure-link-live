import { Stethoscope, Mail, Twitter, Linkedin, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
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
          <p className="text-primary-foreground/70 max-w-md text-sm leading-relaxed">
            The global stage where medicine meets innovation. Three days of science,
            connection and inspiration in the heart of Geneva.
          </p>
          <div className="flex gap-3 mt-6">
            {[Twitter, Linkedin, Instagram, Mail].map((Icon, i) => (
              <a key={i} href="#" className="h-10 w-10 rounded-xl glass flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-4">Conference</div>
          <ul className="space-y-2.5 text-sm text-primary-foreground/80">
            <li><Link to="/timeline" className="hover:text-secondary-glow transition-colors">Live Timeline</Link></li>
            <li><Link to="/partners" className="hover:text-secondary-glow transition-colors">Partners</Link></li>
            <li><Link to="/clubs" className="hover:text-secondary-glow transition-colors">Clubs</Link></li>
            <li><Link to="/organizers" className="hover:text-secondary-glow transition-colors">Organizers</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-4">Contact</div>
          <ul className="space-y-2.5 text-sm text-primary-foreground/80">
            <li>contact@medconf.org</li>
            <li>+41 22 555 0100</li>
            <li>Geneva Convention Center<br/>Switzerland</li>
          </ul>
        </div>
      </div>
      <div className="container relative border-t border-white/10 py-6 text-xs text-primary-foreground/60 flex flex-wrap justify-between gap-3">
        <span>© 2026 MedConf. All rights reserved.</span>
        <span>Crafted for the global medical community.</span>
      </div>
    </footer>
  );
}
