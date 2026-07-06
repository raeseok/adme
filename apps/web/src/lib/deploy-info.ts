export function getDeployCommit(): string {
  return process.env.NEXT_PUBLIC_DEPLOY_COMMIT ?? "unknown";
}

export function getAppStage(): string {
  return process.env.NEXT_PUBLIC_APP_STAGE ?? "stage-0-5-vercel-shell";
}

export function getRuntimeLabel(): "vercel" | "local" {
  return process.env.VERCEL === "1" ? "vercel" : "local";
}

export function isSupabaseUrlConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function isSupabaseAnonKeyConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
