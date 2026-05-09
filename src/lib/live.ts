import { supabase } from "@/lib/supabase";

export type LiveSession = {
  id: string;
  stream_url: string | null;
  full_name: string;
  talk_title: string;
  starts_at: string;
  ends_at: string;
};

export type LivePreview =
  | { kind: "youtube"; url: string; embedUrl: string }
  | { kind: "meet"; url: string }
  | { kind: "external"; url: string };

export function toYouTubeEmbedUrl(input: string) {
  try {
    const url = new URL(input);

    // Already embed
    if (url.hostname.includes("youtube.com") && url.pathname.startsWith("/embed/")) {
      return input;
    }

    // youtu.be/<id>
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace("/", "").trim();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    // youtube.com/watch?v=<id>
    if (url.hostname.includes("youtube.com")) {
      // watch?v=ID
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;

      // live/<id> (youtube short/live link)
      if (url.pathname.startsWith("/live/")) {
        const parts = url.pathname.split("/").filter(Boolean);
        const liveId = parts[parts.length - 1];
        if (liveId) return `https://www.youtube.com/embed/${liveId}`;
      }
    }
  } catch {
    // ignore
  }
  return input;
}

export function getLivePreview(input: string): LivePreview {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);

    if (url.hostname.includes("youtube.com") || url.hostname === "youtu.be") {
      return {
        kind: "youtube",
        url: trimmed,
        embedUrl: toYouTubeEmbedUrl(trimmed),
      };
    }

    if (url.hostname.includes("meet.google.com")) {
      return {
        kind: "meet",
        url: trimmed,
      };
    }
  } catch {
    // fall through to external preview
  }

  return {
    kind: "external",
    url: trimmed,
  };
}

export async function fetchLiveSession(): Promise<LiveSession | null> {
  const { data, error } = await supabase
    .from("timeline_cards")
    .select("id, stream_url, full_name, talk_title, starts_at, ends_at")
    .eq("is_live", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data as LiveSession;
}

