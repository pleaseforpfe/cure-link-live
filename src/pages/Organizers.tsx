import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Linkedin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/language";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

type OrganizerGroup = {
  id: string;
  title: string;
  description: string;
  website_url: string;
  image_url: string;
};

type OrganizerPerson = {
  id: string;
  group_id: string;
  full_name: string;
  role: string;
  bio: string | null;
  photo_url: string;
  linkedin_url: string | null;
};

type GroupWithPeople = OrganizerGroup & { people: OrganizerPerson[] };

export default function Organizers() {
  const { t } = useLanguage();

  const [groups, setGroups] = useState<GroupWithPeople[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);

      const [groupsRes, peopleRes] = await Promise.all([
        supabase
          .from("organizer_groups")
          .select("id, title, description, website_url, image_url, created_at")
          .order("created_at", { ascending: true }),
        supabase
          .from("organizer_people")
          .select("id, group_id, full_name, role, bio, photo_url, linkedin_url, created_at")
          .order("created_at", { ascending: true }),
      ]);

      if (cancelled) return;
      if (groupsRes.error) {
        setError(groupsRes.error.message);
        setGroups([]);
        setLoading(false);
        return;
      }
      if (peopleRes.error) {
        setError(peopleRes.error.message);
        setGroups([]);
        setLoading(false);
        return;
      }

      const rawGroups = (groupsRes.data ?? []) as OrganizerGroup[];
      const rawPeople = (peopleRes.data ?? []) as OrganizerPerson[];

      const peopleByGroup = new Map<string, OrganizerPerson[]>();
      for (const p of rawPeople) {
        const list = peopleByGroup.get(p.group_id) ?? [];
        list.push(p);
        peopleByGroup.set(p.group_id, list);
      }

      const withPeople: GroupWithPeople[] = rawGroups.map((g) => ({
        ...g,
        people: peopleByGroup.get(g.id) ?? [],
      }));

      setGroups(withPeople);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const fallbackImages = useMemo(() => [event1, event2, event3], []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-50" />
          <div className="container relative py-20 md:py-28 text-center">
            <div className="text-xs uppercase tracking-widest text-secondary-glow font-bold mb-4">{t.organizersHero.kicker}</div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4">{t.organizersHero.title}</h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">{t.organizersHero.description}</p>
          </div>
        </section>

        <section className="container py-16">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading organizers...</div>
          ) : error ? (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {groups.map((group, idx) => (
                <Dialog key={group.id}>
                  <motion.article
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.03 }}
                    className="group rounded-3xl bg-card border border-border overflow-hidden card-hover"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={group.image_url || fallbackImages[idx % fallbackImages.length]}
                        alt={group.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
                    </div>

                    <div className="p-6">
                      <div className="text-xs uppercase tracking-widest text-secondary font-bold mb-2">Organizer</div>
                      <h2 className="text-xl font-bold mb-2">{group.title}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
                      <div className="flex items-center justify-between gap-3">
                        <a
                          href={group.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary"
                        >
                          Official site
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outlineGlow" size="sm" className="shrink-0">
                            View details
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </div>
                    </div>
                  </motion.article>

                  <DialogContent className="max-w-4xl p-0 overflow-hidden">
                    <div className="grid md:grid-cols-[280px_1fr]">
                      <div className="relative hidden md:block">
                        <img
                          src={group.image_url || fallbackImages[idx % fallbackImages.length]}
                          alt={group.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                          <div className="text-xs uppercase tracking-widest font-bold opacity-90 mb-1">Facility</div>
                          <div className="text-xl font-extrabold leading-tight">{group.title}</div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <DialogHeader className="p-6 pb-3">
                          <DialogTitle className="text-2xl font-extrabold">{group.title}</DialogTitle>
                          <DialogDescription className="text-sm">{group.description}</DialogDescription>
                          <div className="pt-3">
                            <Button asChild variant="secondary" size="sm">
                              <a href={group.website_url} target="_blank" rel="noreferrer">
                                Official website
                                <ArrowUpRight />
                              </a>
                            </Button>
                          </div>
                        </DialogHeader>

                        <ScrollArea className="max-h-[65vh]">
                          <div className="p-6 pt-0">
                            <div className="grid sm:grid-cols-2 gap-4">
                              {group.people.map((person) => (
                                <Card key={person.id} className="rounded-2xl">
                                  <CardHeader className="flex-row items-center gap-4 space-y-0 p-5">
                                    <img
                                      src={person.photo_url}
                                      alt={person.full_name}
                                      className="h-14 w-14 rounded-2xl object-cover ring-1 ring-border"
                                      loading="lazy"
                                    />
                                    <div className="min-w-0">
                                      <div className="font-bold leading-tight truncate">{person.full_name}</div>
                                      <div className="text-xs uppercase tracking-widest text-secondary font-bold">{person.role}</div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="px-5 pb-0">
                                    <p className="text-sm text-muted-foreground">{person.bio ?? ""}</p>
                                  </CardContent>
                                  <CardFooter className="p-5 pt-4">
                                    {person.linkedin_url ? (
                                      <Button asChild variant="outlineGlow" size="sm" className="rounded-full">
                                        <a href={person.linkedin_url} target="_blank" rel="noreferrer">
                                          LinkedIn
                                          <Linkedin />
                                        </a>
                                      </Button>
                                    ) : (
                                      <Button variant="outline" size="sm" disabled className="rounded-full">
                                        LinkedIn
                                        <Linkedin />
                                      </Button>
                                    )}
                                  </CardFooter>
                                </Card>
                              ))}
                              {group.people.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No people yet.</div>
                              ) : null}
                            </div>
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

