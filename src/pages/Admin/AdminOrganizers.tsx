import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";

type OrganizerGroup = {
  id: string;
  slug: string;
  title: string;
  description: string;
  website_url: string;
  image_url: string;
  created_at: string;
};

type OrganizerPerson = {
  id: string;
  group_id: string;
  full_name: string;
  role: string;
  bio: string | null;
  photo_url: string;
  linkedin_url: string | null;
  created_at: string;
};

const ORGANIZERS_BUCKET = "organizers";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function newUuid() {
  const id = globalThis.crypto?.randomUUID?.();
  if (!id) throw new Error("Browser does not support crypto.randomUUID().");
  return id;
}

async function uploadToBucket(path: string, file: File) {
  const { error } = await supabase.storage.from(ORGANIZERS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(ORGANIZERS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default function AdminOrganizers() {
  const [groups, setGroups] = useState<OrganizerGroup[]>([]);
  const [people, setPeople] = useState<OrganizerPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openGroup, setOpenGroup] = useState(false);
  const [openPerson, setOpenPerson] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [savingStage, setSavingStage] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmActionLabel, setConfirmActionLabel] = useState("Confirm");
  const [confirmRunning, setConfirmRunning] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

  const groupImageInputRef = useRef<HTMLInputElement | null>(null);
  const personPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [groupImagePreviewUrl, setGroupImagePreviewUrl] = useState<string | null>(null);

  const [personPhotoFile, setPersonPhotoFile] = useState<File | null>(null);
  const [personPhotoPreviewUrl, setPersonPhotoPreviewUrl] = useState<string | null>(null);

  const [groupForm, setGroupForm] = useState({
    slug: "",
    title: "",
    description: "",
    website_url: "",
  });

  const [personForm, setPersonForm] = useState({
    group_id: "",
    full_name: "",
    role: "",
    bio: "",
    linkedin_url: "",
  });

  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  function requestConfirm(args: { title: string; description: string; actionLabel: string; action: () => Promise<void> }) {
    setConfirmTitle(args.title);
    setConfirmDescription(args.description);
    setConfirmActionLabel(args.actionLabel);
    setConfirmAction(() => args.action);
    setConfirmRunning(false);
    setConfirmOpen(true);
  }

  useEffect(() => {
    if (!groupImageFile) {
      if (groupImagePreviewUrl) URL.revokeObjectURL(groupImagePreviewUrl);
      setGroupImagePreviewUrl(null);
      return;
    }
    const next = URL.createObjectURL(groupImageFile);
    setGroupImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next;
    });
    return () => URL.revokeObjectURL(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupImageFile]);

  useEffect(() => {
    if (!personPhotoFile) {
      if (personPhotoPreviewUrl) URL.revokeObjectURL(personPhotoPreviewUrl);
      setPersonPhotoPreviewUrl(null);
      return;
    }
    const next = URL.createObjectURL(personPhotoFile);
    setPersonPhotoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next;
    });
    return () => URL.revokeObjectURL(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personPhotoFile]);

  async function refresh() {
    setLoading(true);
    setError(null);
    const [groupsRes, peopleRes] = await Promise.all([
      supabase
        .from("organizer_groups")
        .select("id, slug, title, description, website_url, image_url, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("organizer_people")
        .select("id, group_id, full_name, role, bio, photo_url, linkedin_url, created_at")
        .order("created_at", { ascending: true }),
    ]);

    if (groupsRes.error) {
      setError(groupsRes.error.message);
      setLoading(false);
      return;
    }
    if (peopleRes.error) {
      setError(peopleRes.error.message);
      setLoading(false);
      return;
    }

    setGroups((groupsRes.data ?? []) as OrganizerGroup[]);
    setPeople((peopleRes.data ?? []) as OrganizerPerson[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!openGroup) {
      setError(null);
      setGroupForm({ slug: "", title: "", description: "", website_url: "" });
      setGroupImageFile(null);
      setSavingProgress(0);
      setSavingStage(null);
    }
  }, [openGroup]);

  useEffect(() => {
    if (!openPerson) {
      setError(null);
      setPersonForm({ group_id: "", full_name: "", role: "", bio: "", linkedin_url: "" });
      setPersonPhotoFile(null);
      setSavingProgress(0);
      setSavingStage(null);
    }
  }, [openPerson]);

  async function createGroup() {
    setError(null);
    if (saving) return;

    const slug = (groupForm.slug.trim() || slugify(groupForm.title)).trim();
    const title = groupForm.title.trim();
    const description = groupForm.description.trim();
    const websiteUrl = groupForm.website_url.trim();

    if (!title || !description || !websiteUrl || !slug) {
      const msg = "Please fill: Title, Description, Website URL.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!groupImageFile) {
      const msg = "Group image is required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    let createdId: string | null = null;
    try {
      setSaving(true);
      const id = newUuid();
      createdId = id;

      setSavingStage("Creating facility...");
      setSavingProgress(10);
      const payload = {
        id,
        slug,
        title,
        description,
        website_url: websiteUrl,
        image_url: "",
      };
      const insertRes = await supabase.from("organizer_groups").insert(payload);
      if (insertRes.error) throw insertRes.error;

      setSavingStage("Uploading image...");
      setSavingProgress(45);
      const folder = `groups/${slugify(title) || slug}/${id}`;
      const imagePath = `${folder}/cover-${Date.now()}-${safeFileName(groupImageFile.name)}`;
      const publicUrl = await uploadToBucket(imagePath, groupImageFile);

      setSavingStage("Finalizing...");
      setSavingProgress(85);
      const updateRes = await supabase.from("organizer_groups").update({ image_url: publicUrl }).eq("id", id);
      if (updateRes.error) throw updateRes.error;

      setSavingProgress(100);
      setOpenGroup(false);
      toast.success("Facility added");
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add facility";
      setError(msg);
      toast.error(msg);
      if (createdId) {
        try {
          await supabase.from("organizer_groups").delete().eq("id", createdId);
        } catch {
          // ignore
        }
      }
    } finally {
      setSaving(false);
      setSavingStage(null);
      setSavingProgress(0);
    }
  }

  async function doDeleteGroup(id: string) {
    setError(null);
    const { error } = await supabase.from("organizer_groups").delete().eq("id", id);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    refresh();
  }

  function removeGroup(group: Pick<OrganizerGroup, "id" | "title">) {
    requestConfirm({
      title: "Delete facility?",
      description: group.title,
      actionLabel: "Delete",
      action: async () => doDeleteGroup(group.id),
    });
  }

  async function createPerson() {
    setError(null);
    if (saving) return;

    const groupId = personForm.group_id;
    const fullName = personForm.full_name.trim();
    const role = personForm.role.trim();
    const bio = personForm.bio.trim() ? personForm.bio.trim() : null;
    const linkedinUrl = personForm.linkedin_url.trim() ? personForm.linkedin_url.trim() : null;

    if (!groupId || !fullName || !role) {
      const msg = "Please fill: Group, Full name, Role.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!personPhotoFile) {
      const msg = "Person photo is required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    let createdId: string | null = null;
    try {
      setSaving(true);
      const id = newUuid();
      createdId = id;

      setSavingStage("Creating person...");
      setSavingProgress(10);
      const payload = {
        id,
        group_id: groupId,
        full_name: fullName,
        role,
        bio,
        photo_url: "",
        linkedin_url: linkedinUrl,
      };
      const insertRes = await supabase.from("organizer_people").insert(payload);
      if (insertRes.error) throw insertRes.error;

      setSavingStage("Uploading photo...");
      setSavingProgress(45);
      const groupTitle = groupById.get(groupId)?.title ?? "group";
      const folder = `people/${slugify(groupTitle)}/${groupId}/${id}`;
      const photoPath = `${folder}/photo-${Date.now()}-${safeFileName(personPhotoFile.name)}`;
      const publicUrl = await uploadToBucket(photoPath, personPhotoFile);

      setSavingStage("Finalizing...");
      setSavingProgress(85);
      const updateRes = await supabase.from("organizer_people").update({ photo_url: publicUrl }).eq("id", id);
      if (updateRes.error) throw updateRes.error;

      setSavingProgress(100);
      setOpenPerson(false);
      toast.success("Person added");
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add person";
      setError(msg);
      toast.error(msg);
      if (createdId) {
        try {
          await supabase.from("organizer_people").delete().eq("id", createdId);
        } catch {
          // ignore
        }
      }
    } finally {
      setSaving(false);
      setSavingStage(null);
      setSavingProgress(0);
    }
  }

  async function doDeletePerson(id: string) {
    setError(null);
    const { error } = await supabase.from("organizer_people").delete().eq("id", id);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    refresh();
  }

  function removePerson(person: Pick<OrganizerPerson, "id" | "full_name" | "role">) {
    requestConfirm({
      title: "Delete person?",
      description: `${person.full_name}\n${person.role}`,
      actionLabel: "Delete",
      action: async () => doDeletePerson(person.id),
    });
  }

  return (
    <div className="space-y-6">
      <input
        ref={groupImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setGroupImageFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={personPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setPersonPhotoFile(e.target.files?.[0] ?? null)}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmRunning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmRunning || !confirmAction}
              onClick={async (e) => {
                e.preventDefault();
                if (!confirmAction) return;
                setConfirmRunning(true);
                try {
                  await confirmAction();
                  setConfirmOpen(false);
                } finally {
                  setConfirmRunning(false);
                }
              }}
            >
              {confirmRunning ? "Working..." : confirmActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error ? (
        <Card className="rounded-3xl border-red-200 dark:border-red-900/40">
          <CardContent className="p-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardContent className="p-0">
            <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Facilities</div>
                <div className="text-sm font-extrabold">Organizer groups</div>
              </div>
              <Dialog open={openGroup} onOpenChange={(next) => (saving ? null : setOpenGroup(next))}>
                <DialogTrigger asChild>
                  <Button variant="hero" className="rounded-2xl">
                    <Plus className="h-4 w-4" />
                    Add group
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="relative max-w-lg max-h-[90vh] overflow-hidden rounded-3xl"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <DialogHeader>
                    <DialogTitle>Add group</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-y-auto pr-4 -mr-2">
                    <div className="grid gap-4 mr-2">
                    <div className="grid gap-2">
                      <Label>Title</Label>
                      <Input
                        value={groupForm.title}
                        onChange={(e) => {
                          const nextTitle = e.target.value;
                          setGroupForm((p) => ({ ...p, title: nextTitle, slug: p.slug ? p.slug : slugify(nextTitle) }));
                        }}
                        disabled={saving}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Slug (unique)</Label>
                      <Input
                        value={groupForm.slug}
                        onChange={(e) => setGroupForm((p) => ({ ...p, slug: e.target.value }))}
                        placeholder="faculty"
                        disabled={saving}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Input
                        value={groupForm.description}
                        onChange={(e) => setGroupForm((p) => ({ ...p, description: e.target.value }))}
                        disabled={saving}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Official website</Label>
                      <Input
                        value={groupForm.website_url}
                        onChange={(e) => setGroupForm((p) => ({ ...p, website_url: e.target.value }))}
                        placeholder="https://..."
                        disabled={saving}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Facility image (required)</Label>
                      <div className="rounded-3xl border border-border bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">Upload facility cover</div>
                            <div className="text-xs text-muted-foreground">Recommended: 1200x900 (4:3).</div>
                          </div>
                          <Button
                            type="button"
                            variant="outlineGlow"
                            size="sm"
                            className="rounded-2xl"
                            onClick={() => groupImageInputRef.current?.click()}
                            disabled={saving}
                          >
                            <UploadCloud className="h-4 w-4" />
                            Choose file
                          </Button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center">
                          <div className="h-[140px] w-[140px] rounded-3xl overflow-hidden bg-muted ring-1 ring-border">
                            {groupImagePreviewUrl ? (
                              <img src={groupImagePreviewUrl} alt="Selected" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                No image selected
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            {groupImageFile ? (
                              <div className="text-sm font-semibold truncate">{groupImageFile.name}</div>
                            ) : (
                              <div className="text-sm font-semibold text-red-600 dark:text-red-400">Image required</div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">This appears on the Organizers page.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpenGroup(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={createGroup} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>

                  {saving ? (
                    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
                      <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-elegant p-6">
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold">Saving</div>
                            <div className="text-xs text-muted-foreground truncate">{savingStage ?? "Please wait..."}</div>
                          </div>
                          <div className="ml-auto text-sm font-extrabold tabular-nums">{savingProgress}%</div>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-secondary transition-all" style={{ width: `${savingProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead className="w-[110px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-semibold">{g.title}</TableCell>
                      <TableCell>
                        <div className="h-10 w-10 rounded-2xl overflow-hidden bg-muted ring-1 ring-border">
                          {g.image_url ? <img src={g.image_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => removeGroup(g)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">
                        No facilities yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="p-0">
            <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">People</div>
                <div className="text-sm font-extrabold">Organizer people</div>
              </div>
              <Dialog open={openPerson} onOpenChange={(next) => (saving ? null : setOpenPerson(next))}>
                <DialogTrigger asChild>
                  <Button variant="hero" className="rounded-2xl" disabled={groups.length === 0}>
                    <Plus className="h-4 w-4" />
                    Add person
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="relative max-w-lg max-h-[90vh] overflow-hidden rounded-3xl"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <DialogHeader>
                    <DialogTitle>Add person</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-y-auto pr-4 -mr-2">
                    <div className="grid gap-4 mr-2">
                    <div className="grid gap-2">
                      <Label>Group</Label>
                      <select
                        className="h-10 rounded-2xl border border-input bg-background px-3 text-sm"
                        value={personForm.group_id}
                        onChange={(e) => setPersonForm((p) => ({ ...p, group_id: e.target.value }))}
                        disabled={saving}
                      >
                        <option value="" disabled>
                          Select group...
                        </option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Full name</Label>
                      <Input
                        value={personForm.full_name}
                        onChange={(e) => setPersonForm((p) => ({ ...p, full_name: e.target.value }))}
                        disabled={saving}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Role</Label>
                      <Input
                        value={personForm.role}
                        onChange={(e) => setPersonForm((p) => ({ ...p, role: e.target.value }))}
                        disabled={saving}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Bio (optional)</Label>
                      <Input value={personForm.bio} onChange={(e) => setPersonForm((p) => ({ ...p, bio: e.target.value }))} disabled={saving} />
                    </div>

                    <div className="grid gap-2">
                      <Label>Person photo (required)</Label>
                      <div className="rounded-3xl border border-border bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">Upload photo</div>
                            <div className="text-xs text-muted-foreground">Recommended: 800x800 square.</div>
                          </div>
                          <Button
                            type="button"
                            variant="outlineGlow"
                            size="sm"
                            className="rounded-2xl"
                            onClick={() => personPhotoInputRef.current?.click()}
                            disabled={saving}
                          >
                            <UploadCloud className="h-4 w-4" />
                            Choose file
                          </Button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center">
                          <div className="h-[140px] w-[140px] rounded-3xl overflow-hidden bg-muted ring-1 ring-border">
                            {personPhotoPreviewUrl ? (
                              <img src={personPhotoPreviewUrl} alt="Selected" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                No photo selected
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            {personPhotoFile ? (
                              <div className="text-sm font-semibold truncate">{personPhotoFile.name}</div>
                            ) : (
                              <div className="text-sm font-semibold text-red-600 dark:text-red-400">Photo required</div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">Used in the facility details window.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>LinkedIn URL (optional)</Label>
                      <Input
                        value={personForm.linkedin_url}
                        onChange={(e) => setPersonForm((p) => ({ ...p, linkedin_url: e.target.value }))}
                        placeholder="https://linkedin.com/in/..."
                        disabled={saving}
                      />
                    </div>

                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpenPerson(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={createPerson} disabled={!personForm.group_id || saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>

                  {saving ? (
                    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
                      <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-elegant p-6">
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold">Saving</div>
                            <div className="text-xs text-muted-foreground truncate">{savingStage ?? "Please wait..."}</div>
                          </div>
                          <div className="ml-auto text-sm font-extrabold tabular-nums">{savingProgress}%</div>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-secondary transition-all" style={{ width: `${savingProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead className="w-[110px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {people.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold">{p.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{groupById.get(p.group_id)?.title ?? "-"}</TableCell>
                      <TableCell>
                        <div className="h-10 w-10 rounded-2xl overflow-hidden bg-muted ring-1 ring-border">
                          {p.photo_url ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => removePerson(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {people.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-muted-foreground">
                        No people yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
