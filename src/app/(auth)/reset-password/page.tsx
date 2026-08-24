"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/lib/actions/auth";
import { toast } from "@/hooks/use-toast";
import { Lock, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await resetPasswordAction(formData);

    setLoading(false);

    if (result.success) {
      toast.success("Password Updated", "Your password has been reset. Redirecting...");
      router.push("/");
    } else {
      toast.error("Reset Failed", result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-bold font-heading text-white tracking-tight">
          Set new password
        </h1>
        <p className="text-xs text-zinc-400 font-body">
          Enter a new secure password for your store account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          name="password"
          type="password"
          required
          placeholder="At least 6 characters"
          leftIcon={<Lock className="w-4 h-4 text-zinc-500" />}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full h-11 font-semibold text-xs tracking-wider uppercase"
          isLoading={loading}
          leftIcon={<ShieldCheck className="w-4 h-4" />}
        >
          Update Password
        </Button>
      </form>
    </div>
  );
}
