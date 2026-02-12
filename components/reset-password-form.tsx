"use client"
import { Eye, EyeOff, Loader2, Check } from "lucide-react"
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
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { updatePassword } from "@/app/login/actions"
import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ResetPasswordForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(updatePassword, null)
    const [showPassword, setShowPassword] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error)
        }
        if (state?.success) {
            setIsSuccess(true)
            toast.success(state.success)
            const timer = setTimeout(() => {
                router.push("/")
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [state, router])

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Set New Password</CardTitle>
                    <CardDescription>
                        Enter your new password below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="password">New Password</FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="••••••••"
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
                                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                />
                            </Field>
                            <Field>
                                <Button
                                    type="submit"
                                    disabled={isPending || isSuccess}
                                    className={cn(
                                        "w-full transition-all duration-300",
                                        isSuccess && "bg-green-600 hover:bg-green-600 text-white"
                                    )}
                                >
                                    {isSuccess ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Password Updated
                                        </>
                                    ) : isPending ? (
                                        <>
                                            <Loader2 className="animate-spin h-4 w-4" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Password"
                                    )}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
