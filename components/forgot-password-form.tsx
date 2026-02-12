"use client"
import { Loader2, Check, ArrowLeft } from "lucide-react"
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
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { sendResetLink } from "@/app/login/actions"
import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ForgotPasswordForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(sendResetLink, null)
    const [isSuccess, setIsSuccess] = useState(false)

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error)
        }
        if (state?.success) {
            setIsSuccess(true)
            toast.success(state.success)
        }
    }, [state])

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email to receive a password reset link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    onChange={(e) => {
                                        e.target.value = e.target.value.toLowerCase().replace(/\s/g, "")
                                    }}
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
                                            Email Sent
                                        </>
                                    ) : isPending ? (
                                        <>
                                            <Loader2 className="animate-spin h-4 w-4" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>
                            </Field>
                            <FieldDescription className="text-center">
                                <a
                                    href="/"
                                    className="inline-flex items-center gap-2 text-sm hover:underline cursor-pointer"
                                >
                                    <ArrowLeft className="h-3 w-3" />
                                    Back to login
                                </a>
                            </FieldDescription>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
