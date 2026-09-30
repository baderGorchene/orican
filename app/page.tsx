import { redirect } from 'next/navigation';

/** The landing page has been removed on the staging branch.
 *  Redirect all root-level traffic to the Studio. */
export default function RootPage() {
  redirect('/studio');
}
