"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Gamepad2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  creatorType: z.enum(["Teacher", "Content Creator", "Both", "Student"]),
});
type FormData = z.infer<typeof schema>;

const roles = ["Teacher", "Content Creator", "Both", "Student"] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { creatorType: "Teacher" },
  });
  const creatorType = watch("creatorType");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast("error", err.error ?? "Registration failed");
        return;
      }
      await signIn("credentials", { email: data.email, password: data.password, redirect: false });
      toast("success", "Account created!");
      router.push(data.creatorType === "Student" ? "/learn" : "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-4"><Gamepad2 className="h-10 w-10 text-primary" /></div>
          <h1 className="font-heading font-bold text-2xl text-center mb-6">Create your account</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 8 characters" {...register("password")} />
              <FieldError message={errors.password?.message} />
            </div>
            <div>
              <Label>I am a:</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setValue("creatorType", r)}
                    className={cn(
                      "rounded-btn border px-3 py-2 text-sm transition-colors",
                      creatorType === r ? "border-primary bg-primary-light text-primary-dark font-medium" : "border-border"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-txt-secondary"><span className="h-px bg-border flex-1" />or<span className="h-px bg-border flex-1" /></div>
          <Button variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            Continue with Google
          </Button>
          <p className="text-sm text-center text-txt-secondary mt-6">
            Already have an account? <Link href="/auth/login" className="text-primary font-medium">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
