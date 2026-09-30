import { redirect } from 'next/navigation';

/** The landing page has been removed on the staging branch.
 *  Redirect all root-level traffic to the 3D configurator. */
export default function RootPage() {
  redirect('/configurator');
}
