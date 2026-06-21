"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, User, ShieldHalf } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export default function SignupPage() {
  const [role, setRole] = useState<"citizen" | "admin">("citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signupError) {
      toast.error(signupError.message);
      setLoading(false);
      return;
    }

    const user = data?.user;
    if (user) {
      try {
        // Prevent duplicate profile creation by checking if it already exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (fetchError) {
          console.error("Error checking profile existence:", fetchError);
        }

        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              full_name: name,
              role: "citizen",
              created_at: new Date().toISOString(),
            });

          if (profileError) {
            // If another process or the DB trigger created it concurrently, ignore duplicate key error code '23505'
            if (profileError.code === "23505") {
              console.log("Profile was already created concurrently.");
            } else {
              throw profileError;
            }
          }
        }
      } catch (profileErr: any) {
        console.error("Failed to create user profile:", profileErr);
        toast.error("Failed to create user profile. Please try logging in or contact support.");
        setLoading(false);
        return;
      }
    }

    toast.success("Account created! Please check your email to verify your account.");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-secondary-950 hover:text-primary-600 transition-colors">
            <ShieldAlert className="h-10 w-10 text-primary-500 mx-auto" />
            <span className="font-bold text-2xl tracking-tight">ClimateShield</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create an account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">Select your role</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("citizen")}
              className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                role === "citizen" 
                  ? "border-primary-500 bg-primary-50 text-primary-700" 
                  : "border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <User className={`h-8 w-8 mb-2 ${role === "citizen" ? "text-primary-500" : ""}`} />
              <span className="font-medium">Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                role === "admin" 
                  ? "border-secondary-500 bg-secondary-50 text-secondary-700" 
                  : "border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <ShieldHalf className={`h-8 w-8 mb-2 ${role === "admin" ? "text-secondary-500" : ""}`} />
              <span className="font-medium">Admin</span>
            </button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
