import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { signUp } from "#/lib/auth-client";
import { initUserData } from "#/lib/user-setup";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof schema>;

function RegisterPage() {
  const navigate = useNavigate();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: RegisterValues) => {
    const result = await signUp.email({
      email: values.email,
      password: values.password,
      name: values.email.split("@")[0]!,
    });

    if (result.error) {
      toast.error(result.error.message ?? "Registration failed");
      return;
    }

    // Initialise default preferences + notification settings for the new user
    try {
      await initUserData();
    } catch {
      // Non-fatal — user can still proceed; defaults applied on next visit
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: "/onboarding" as any });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* App logo */}
        <div className="text-center">
          <span
            className="text-4xl font-bold tracking-widest text-[var(--sport-accent)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            SPORTRAYDAR
          </span>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Your live scores dashboard
          </p>
        </div>

        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[var(--foreground)]">
              Create account
            </CardTitle>
            <CardDescription className="text-[var(--muted-foreground)]">
              Sign up to track your favourite teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Min. 8 characters"
                          autoComplete="new-password"
                          className="border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[var(--sport-accent)] font-semibold text-[var(--background)] hover:bg-[var(--sport-accent)]/90"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Creating account…"
                    : "Create account"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Already have an account?{" "}
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={"/login" as any}
            className="font-medium text-[var(--sport-accent)] underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
