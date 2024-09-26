import { createClient } from '@/utils/supabase/server';
import { Link } from '@nextui-org/react';
import Navlinks from './Navlinks';

export default async function Navbar() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <nav className="bg-white shadow-md">
      <div className="flex justify-between items-center py-4">
        <Link href="#skip" className="sr-only focus:not-sr-only">
          Skip to content
        </Link>
        <h3>Dating App</h3>
        <Navlinks user={user} />
      </div>
    </nav>
  );
}
