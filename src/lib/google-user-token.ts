import 'server-only';

export async function saveGoogleUserRefreshToken(_refreshToken: string) {
  // Refresh tokens are persisted as encrypted Vercel environment variables for this
  // private single-user app. Do not write them to Google Drive with a service account.
  return;
}

export async function loadGoogleUserRefreshToken(): Promise<string | undefined> {
  return process.env.GOOGLE_USER_REFRESH_TOKEN;
}
