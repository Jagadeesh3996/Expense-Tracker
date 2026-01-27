import { createClient } from "@/lib/supabase/server";
import { DashboardWrapper } from "@/components/dashboard-wrapper";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const userData = {
        name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
        email: user?.email || "",
        avatar: user?.user_metadata?.avatar || "",
    };

    return (
        <DashboardWrapper user={userData}>
            {children}
        </DashboardWrapper>
    );
}
