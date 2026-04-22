"use client";

import { signIn, getProviders } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("admin@company.com");
  const [providers, setProviders] = useState<Record<string, { id: string; name: string }>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProviders().then((p) => {
      if (p) setProviders(p as Record<string, { id: string; name: string }>);
    });
  }, []);

  const devLogin = async () => {
    setLoading(true);
    await signIn("dev-login", { email, callbackUrl });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Cricket Tournament</h1>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>

        <div className="space-y-4">
          {providers["azure-ad"] && (
            <button
              onClick={() => signIn("azure-ad", { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
                <path d="M0 0h10v10H0z" fill="#F25022" />
                <path d="M11 0h10v10H11z" fill="#7FBA00" />
                <path d="M0 11h10v10H0z" fill="#00A4EF" />
                <path d="M11 11h10v10H11z" fill="#FFB900" />
              </svg>
              Sign in with Microsoft
            </button>
          )}

          {providers["dev-login"] && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {providers["azure-ad"] ? "Or use dev login" : "Dev Login"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <select
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
                >
                  <option value="admin@company.com">Admin (admin@company.com)</option>
                  <option value="captain1@company.com">Captain 1 - Rahul (captain1@company.com)</option>
                  <option value="captain2@company.com">Captain 2 - Priya (captain2@company.com)</option>
                  <option value="viewer@company.com">Viewer - Amit (viewer@company.com)</option>
                </select>

                <button
                  onClick={devLogin}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-cricket-600 text-white rounded-lg hover:bg-cricket-700 font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In as Dev User"}
                </button>
              </div>

              <p className="text-xs text-center text-gray-400">
                Dev login is only available in development mode.
                Run <code className="bg-gray-100 px-1 rounded">npx prisma db seed</code> first.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
