import { getState } from '@/lib/storage/state';
import { contactsFromState } from '@/lib/network';
import { NetworkContactsClient } from '@/components/NetworkContactsClient';

export const dynamic = 'force-dynamic';

export default async function NetworkPage() {
  const state = await getState();
  const contacts = contactsFromState(state);
  return <><section className="hero"><div className="eyebrow">Network</div><h1>Track the people who could help with a real referral.</h1><p>Add professional contacts you actually know. When a company match appears, the app can use this information to identify a real networking opportunity without pretending it has access to LinkedIn.</p></section><NetworkContactsClient contacts={contacts}/></>;
}
