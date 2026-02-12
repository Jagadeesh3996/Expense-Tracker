"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/utils/image-processing";
import { useRouter } from "next/navigation";

interface EditProfileFormProps {
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
    onSuccess: () => void;
}

export function EditProfileForm({ user, onSuccess }: EditProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(user.user_metadata?.full_name || user.user_metadata?.name || "");
    const [phoneNumber, setPhoneNumber] = useState(user.phone || "");
    const [avatarPreview, setAvatarPreview] = useState(user.user_metadata?.avatar_url || "");
    const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
    const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const router = useRouter();

    // Extract Google avatar as fallback if available
    const googleIdentity = (user as any).identities?.find((id: any) => id.provider === 'google');
    const googleAvatar = googleIdentity?.identity_data?.avatar_url || googleIdentity?.identity_data?.picture;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Please upload an image file");
                return;
            }
            setNewAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setIsPhotoRemoved(false);
        }
    };

    const handleRemovePhoto = () => {
        setNewAvatarFile(null);
        setAvatarPreview(googleAvatar || "");
        setIsPhotoRemoved(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let avatarUrl = avatarPreview;

            // 1. Upload avatar if changed
            if (newAvatarFile) {
                const compressedBlob = await compressImage(newAvatarFile, 0.8, 400, 400);
                const fileExt = "webp";
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(fileName, compressedBlob, {
                        contentType: "image/webp",
                        upsert: true,
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(fileName);

                avatarUrl = publicUrl;
            } else if (isPhotoRemoved) {
                // If photo was removed, we use Google avatar or null
                avatarUrl = googleAvatar || "";
            }

            // 2. Update Auth User Metadata and Phone
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    full_name: name,
                    avatar_url: avatarUrl
                },
                phone: phoneNumber || undefined,
            });

            if (updateError) throw updateError;

            toast.success("Profile updated successfully!");
            router.refresh();
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                    <div
                        className="relative cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Avatar className="h-24 w-24 border-2 border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                            <AvatarImage src={avatarPreview} />
                            <AvatarFallback className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-xl font-bold">
                                {name.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-6 w-6 text-white" />
                        </div>
                    </div>

                    {avatarPreview && avatarPreview !== "" && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto();
                            }}
                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
                            title="Remove Photo"
                        >
                            <span className="sr-only">Remove photo</span>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
                <p className="text-xs text-muted-foreground">Click to change profile picture</p>
            </div>

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-emerald-500" />
                        Full Name
                    </Label>
                    <Input
                        id="name"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        className="h-10"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-emerald-500" />
                        Phone Number
                    </Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={isLoading}
                        className="h-10"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Note: Format should include country code (e.g., +91...)</p>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onSuccess}
                    disabled={isLoading}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </div>
        </form>
    );
}
