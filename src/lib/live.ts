import { supabase } from "@/lib/supabase";

export type LiveSession = {
  id: string;
  stream_url: string | null;
  full_name: string;
  talk_title: string;
  starts_at: string;
  ends_at: string;
};

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
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    // ignore
  }
  return input;
}

export async function fetchLiveSession(): Promise<LiveSession | null> {
  const { data, error } = await supabase
    .from("timeline_cards")
    .select("id, stream_url, full_name, talk_title, starts_at, ends_at")
    .eq("is_live", true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data as LiveSession;
}

