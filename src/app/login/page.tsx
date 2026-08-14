import LoginGateway from '@/components/LoginGateway';

const LOGIN_ERRORS: Record<string,string> = {
  oauth_state: 'Your sign-in session expired before it finished. Please try signing in again.',
  identity: 'Google did not return the account information the app needs. Please try again.',
  unverified: 'This Google account is not verified. Please use the approved verified account.',
  unauthorized: 'This Google account is not approved for this private workspace. Sign in with the authorized account instead.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const errorMessage = params.error ? LOGIN_ERRORS[params.error] ?? 'Sign-in could not be completed. Please try again.' : undefined;
  return <LoginGateway errorMessage={errorMessage} />;
}
