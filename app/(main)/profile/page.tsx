import { createClient } from "@/lib/supabase/server";
import {
    User,
    ShieldCheck,
    CreditCard,
    Mail,
    Calendar,
    Key,
    BadgeCheck,
    AlertCircle,
    UserCircle,
    Globe,
    Phone
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileActions } from "./profile-actions";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // Fetch extended profile data
    const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

    const initials = user.email?.charAt(0).toUpperCase() || "U";
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";
    const isVerified = !!user.email_confirmed_at || !!profile?.verified_on;
    const joinDate = user.created_at ? format(new Date(user.created_at), "PPP p") : "N/A";
    const planStart = profile?.created_on ? format(new Date(profile.created_on), "PPP p") : "N/A";
    const planExpire = profile?.plan_expire_on ? format(new Date(profile.plan_expire_on), "PPP p") : "Never";

    // Avatar fallback logic: Metadata -> Google identity -> Initials
    const metadataAvatar = user.user_metadata?.avatar_url;
    const googleIdentity = user.identities?.find(id => id.provider === 'google');
    const googleAvatar = googleIdentity?.identity_data?.avatar_url || googleIdentity?.identity_data?.picture;
    const finalAvatar = metadataAvatar || googleAvatar;

    return (
        <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 pt-0 max-w-5xl mx-auto w-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center gap-6 pb-4">
                <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl dark:border-muted">
                        <AvatarImage src={finalAvatar} />
                        <AvatarFallback className="text-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-muted rounded-full p-1 shadow-md">
                            <BadgeCheck className="h-6 w-6 text-emerald-500 fill-emerald-500/10" />
                        </div>
                    )}
                </div>
                <div className="text-center md:text-left space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                        {isVerified ? (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-[10px] h-5">
                                Verified
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-900/50 text-[10px] h-5">
                                Unverified
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Account Details Card */}
                <Card className="shadow-sm border-muted/60 dark:bg-muted/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserCircle className="h-5 w-5 text-emerald-500" />
                            Account Details
                        </CardTitle>
                        <CardDescription>Managed account information and status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Status</span>
                            </div>
                            <Badge className={cn(
                                "uppercase text-[10px]",
                                (profile?.status === 'active' || !profile?.status)
                                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500"
                                    : "bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500"
                            )}>
                                {profile?.status || "Active"}
                            </Badge>
                        </div>
                        <Separator className="opacity-50" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Current Plan</span>
                            </div>
                            <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 uppercase text-[10px]">
                                {profile?.active_plan || "Free"}
                            </Badge>
                        </div>
                        <Separator className="opacity-50" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Phone Number</span>
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">{user.phone || "Not set"}</span>
                        </div>
                        <Separator className="opacity-50" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Plan Started</span>
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">{planStart}</span>
                        </div>
                        <Separator className="opacity-50" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Plan Expires</span>
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">{planExpire}</span>
                        </div>
                        <Separator className="opacity-50" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Account Created</span>
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">{joinDate}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Security & Providers Card */}
                <Card className="shadow-sm border-muted/60 dark:bg-muted/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Key className="h-5 w-5 text-emerald-500" />
                            Security & Providers
                        </CardTitle>
                        <CardDescription>Authentication methods and account access</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                Linked Accounts
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {user.app_metadata?.provider === 'google' || user.identities?.some(id => id.provider === 'google') ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white dark:bg-muted text-sm font-medium">
                                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.23l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Google
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white dark:bg-muted text-sm font-medium">
                                        Email & Password
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold">Account Actions</h4>
                            <ProfileActions user={user} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
