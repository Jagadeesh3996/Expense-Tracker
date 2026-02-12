"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Key, Loader2, CheckCircle2, UserPen } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { EditProfileForm } from "./edit-profile-form";

interface ProfileActionsProps {
    user: {
        id: string;
        email?: string;
        user_metadata?: {
            full_name?: string;
            name?: string;
            avatar_url?: string;
        };
        phone?: string;
    };
}

export function ProfileActions({ user }: ProfileActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClient();
    const email = user.email || "";

    const handleResetPassword = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });

            if (error) throw error;

            setIsSent(true);
            toast.success("Password reset link sent to your email!");

            setTimeout(() => setIsSent(false), 5000);
        } catch (error: any) {
            toast.error(error.message || "Failed to send reset link");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button
                        className="w-full justify-start gap-2 h-11 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
                    >
                        <UserPen className="h-4 w-4" />
                        <span>Edit Profile</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Update your personal information and profile picture.
                        </DialogDescription>
                    </DialogHeader>
                    <EditProfileForm user={user} onSuccess={() => setIsOpen(false)} />
                </DialogContent>
            </Dialog>

            <Button
                variant="outline"
                className="w-full justify-start gap-2 h-11 cursor-pointer border-emerald-200 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-900/50 dark:hover:border-emerald-400 dark:hover:bg-emerald-500 transition-all group/btn"
                onClick={handleResetPassword}
                disabled={isLoading || isSent}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSent ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 group-hover/btn:text-white" />
                ) : (
                    <Key className="h-4 w-4 text-emerald-500 group-hover/btn:text-white" />
                )}
                <span>
                    {isLoading ? "Sending link..." : isSent ? "Reset link sent!" : "Send Password Reset Link"}
                </span>
            </Button>

            <p className="text-[11px] text-muted-foreground px-1">
                A secure link will be sent to <strong>{email}</strong>. Clicking the link will allow you to set a new password.
            </p>
        </div>
    );
}
