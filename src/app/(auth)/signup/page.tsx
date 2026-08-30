"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, User, Store, ArrowRight } from "lucide-react";

import { CURRENT_TERMS_VERSION } from "@/lib/constants/legal";

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const template = searchParams.get("template");
    if (template) {
      localStorage.setItem("symar_selected_template", template);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const businessName = formData.get("businessName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const terms = formData.get("terms");

    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = "Full name is required";
    if (!businessName.trim()) newErrors.businessName = "Business name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!acceptedTerms || !terms) {
      newErrors.terms = "Please accept the Terms & Conditions to create your account.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      toast.error("Form Validation Failed", newErrors.terms || "Please fix the errors in the form.");
      return;
    }

    try {
      await signUp(name, email, password, businessName, true, CURRENT_TERMS_VERSION);
      
      toast.success("Account Created", "Welcome to Kraftaura Platform!");

      router.push("/choose-plan");
    } catch (err: any) {
      toast.error("SignUp Error", err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-bold font-heading text-white tracking-tight">
          Create merchant account
        </h1>
        <p className="text-xs text-zinc-400 font-body">
          Start building online catalog stores in seconds
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Full Name"
            name="name"
            required
            placeholder="Alex Rivera"
            leftIcon={<User className="w-4 h-4 text-zinc-500" />}
          />
          {errors.name && <p className="text-[10px] text-red-500 mt-1 font-body">{errors.name}</p>}
        </div>

        <div>
          <Input
            label="Business Name"
            name="businessName"
            required
            placeholder="e.g. Aura Fragrances"
            leftIcon={<Store className="w-4 h-4 text-zinc-500" />}
          />
          {errors.businessName && (
            <p className="text-[10px] text-red-500 mt-1 font-body">{errors.businessName}</p>
          )}
        </div>

        <div>
          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="alex@store.com"
            leftIcon={<Mail className="w-4 h-4 text-zinc-500" />}
          />
          {errors.email && <p className="text-[10px] text-red-500 mt-1 font-body">{errors.email}</p>}
        </div>

        <div>
          <Input
            label="Password"
            name="password"
            type="password"
            required
            placeholder="At least 6 characters"
            leftIcon={<Lock className="w-4 h-4 text-zinc-500" />}
          />
          {errors.password && (
            <p className="text-[10px] text-red-500 mt-1 font-body">{errors.password}</p>
          )}
        </div>

        <div>
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            required
            placeholder="Re-enter password"
            leftIcon={<Lock className="w-4 h-4 text-zinc-500" />}
          />
          {errors.confirmPassword && (
            <p className="text-[10px] text-red-500 mt-1 font-body">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="pt-1">
          <div className="flex items-start gap-2.5">
            <input
              id="terms-checkbox"
              type="checkbox"
              name="terms"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (e.target.checked && errors.terms) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.terms;
                    return next;
                  });
                }
              }}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#111111] text-maroon-600 focus:ring-2 focus:ring-maroon-500 focus:ring-offset-1 focus:ring-offset-[#151515] cursor-pointer accent-maroon-600 transition-colors"
              aria-required="true"
            />
            <label
              htmlFor="terms-checkbox"
              className="text-xs text-zinc-300 font-body cursor-pointer select-none leading-relaxed"
            >
              I agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-maroon-400 hover:text-maroon-300 font-semibold underline underline-offset-2 transition-colors inline-flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-maroon-400 hover:text-maroon-300 font-semibold underline underline-offset-2 transition-colors inline-flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.terms && <p className="text-[10px] text-red-500 mt-1 font-body">{errors.terms}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={!acceptedTerms || loading}
          className="w-full h-11 mt-2 font-semibold text-xs tracking-wider uppercase shadow-glow disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-zinc-800 disabled:shadow-none transition-all"
          isLoading={loading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          title={!acceptedTerms ? "Please accept the Terms & Conditions to create your account." : undefined}
        >
          Create Account
        </Button>
      </form>

      <div className="text-center text-xs text-zinc-400 font-body border-t border-white/10 pt-4">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-white hover:text-maroon-300 font-medium font-heading transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-maroon-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SignupFormContent />
    </Suspense>
  );
}
