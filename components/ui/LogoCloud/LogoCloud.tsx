import Image from 'next/image';

export default function LogoCloud() {
  return (
    <div>
      <p className="mt-24 text-xs uppercase text-zinc-400 text-center font-bold tracking-[0.3em]">
        Brought to you by
      </p>
      <div className="grid grid-cols-1 place-items-center	my-12 space-y-4 sm:mt-8 sm:space-y-0 md:mx-auto md:max-w-2xl sm:grid sm:gap-6 sm:grid-cols-5">
        <div className="flex items-center justify-start h-12">
          <a href="https://nextjs.org" aria-label="Next.js Link">
            <Image
              src="/nextjs.svg"
              alt="Next.js Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </a>
        </div>
        <div className="flex items-center justify-start h-12">
          <a href="https://vercel.com" aria-label="Vercel.com Link">
            <Image
              src="/vercel.svg"
              alt="Vercel.com Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </a>
        </div>
        <div className="flex items-center justify-start h-12">
          <a href="https://stripe.com" aria-label="stripe.com Link">
            <Image
              src="/stripe.svg"
              alt="stripe.com Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </a>
        </div>
        <div className="flex items-center justify-start h-12">
          <a href="https://supabase.io" aria-label="supabase.io Link">
            <Image
              src="/supabase.svg"
              alt="supabase.io Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </a>
        </div>
        <div className="flex items-center justify-start h-12">
          <a href="https://github.com" aria-label="github.com Link">
            <Image
              src="/github.svg"
              alt="github.com Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </a>
        </div>
        <div className="flex items-center justify-start h-12">
          <a href="https://transistor.fm" aria-label="transistor.fm Link">
            <Image
              src="/images/logos/transistor.svg"
              alt="Transistor"
              width={158}
              height={48}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
