import { supabase } from "@/lib/supabase";

export type ActiveProgramFile = {
  id: string;
  title: string;
  file_url: string;
  created_at: string;
};

export async function fetchActiveProgramFile(): Promise<ActiveProgramFile | null> {
  const { data, error } = await supabase
    .from("program_files")
    .select("id, title, file_url, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data as ActiveProgramFile;
}

