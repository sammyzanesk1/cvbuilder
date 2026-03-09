"use client";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";

export default function SignOutPage() {
  const { signOut } = useClerk();

  // Auto sign out if somehow signed in
  signOut({ redirectUrl: "/sign-out" });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md space-y-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          You&apos;re Signed Out
        </h1>
        <p className="text-xl text-gray-600">
          You&apos;ve been successfully logged out of your account.
        </p>
        <div>
          <Link
            href="/sign-in"
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-bold text-white transition-colors hover:bg-blue-900/90"
          >
            Sign In Again
          </Link>
        </div>
      </div>
    </main>
  );
}
