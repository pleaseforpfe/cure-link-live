import { toast } from "@/components/ui/sonner";

function inferFileName(url: string) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last && last.includes(".")) return last;
  } catch {
    // ignore
  }
  return "download";
}

export async function downloadPublicFile(args: { url: string; fileName?: string }) {
  const { url, fileName } = args;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = (fileName || inferFileName(url)).replace(/[/\\?%*:|"<>]/g, "_");
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    // allow the click to complete before cleanup
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      a.remove();
    }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Download failed";
    toast.error(msg);
  }
}

