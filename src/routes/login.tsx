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
import { signIn } from "#/lib/auth-client";
import { getUserPreferences } from "#/lib/user-setup";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof schema>;

function LoginPage() {
  const navigate = useNavigate();

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    const result = await signIn.email({
      email: values.email,
      password: values.password,
    });

    if (result.error) {
      toast.error(result.error.message ?? "Sign in failed");
      return;
    }

    // Route to onboarding if not yet complete, otherwise dashboard
    const prefs = await getUserPreferences();
    if (!prefs?.onboardingComplete) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: "/onboarding" as any });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: "/dashboard" as any });
    }
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
              Sign in
            </CardTitle>
            <CardDescription className="text-[var(--muted-foreground)]">
              Enter your email and password to continue
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
                          placeholder="••••••••"
                          autoComplete="current-password"
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
                  {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Don&apos;t have an account?{" "}
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={"/register" as any}
            className="font-medium text-[var(--sport-accent)] underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
