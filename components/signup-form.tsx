"use client"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signup } from "@/app/signup/actions"
import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { signInWithGoogle } from "@/app/login/actions"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(signup, null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true)
    const result = await signInWithGoogle()
    if (result?.error) {
      toast.error(result.error)
      setIsGoogleLoading(false)
    }
  }

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
    if (state?.success) {
      toast.success("Verification mail sent successfully!", {
        description: "Please verify your email before logging in."
      })
      router.push('/')
    }
  }, [state, router])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleSignup}
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Connecting with Google...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      Sign up with Google
                    </>
                  )}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input id="name" name="name" type="text" placeholder="your name" required defaultValue={state?.fields?.name} />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  defaultValue={state?.fields?.email}
                  onChange={(e) => {
                    e.target.value = e.target.value.toLowerCase().replace(/\s/g, "")
                  }}
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        defaultValue={state?.fields?.password}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        defaultValue={state?.fields?.['confirm-password']}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showConfirmPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 6 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating account..." : "Create Account"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <a href="/">Log in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
