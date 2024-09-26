import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Welcome to Dating App!</h1>
      <div className="space-x-4">
        <Link href="/auth/login" className="btn btn-primary">
          Login
        </Link>
        <Link href="/app" className="btn btn-secondary">
          Use Anonymously
        </Link>
      </div>
      <div className="mt-8">
        <Link href="/terms" className="text-sm text-gray-500 hover:underline">
          Terms and Conditions
        </Link>
      </div>
    </div>
  );
}
