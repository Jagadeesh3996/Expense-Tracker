import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreditCard, Tag } from "lucide-react";

export default async function Page() {
  const supabase = await createClient();

  const { count: paymentModesCount } = await supabase
    .from("payment_modes")
    .select("*", { count: "exact", head: true });

  const { count: categoriesCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {/* Payment Modes Card */}
        <Link
          href="/master/payment-modes"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-muted/50 dark:shadow-none h-32 cursor-pointer border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />

          <div className="relative z-10 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Payment Modes</h3>
            <div className="rounded-full bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="text-2xl font-bold text-foreground">{paymentModesCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total active methods
            </p>
          </div>
        </Link>

        {/* Categories Card */}
        <Link
          href="/master/categories"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-muted/50 dark:shadow-none h-32 cursor-pointer border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/50"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />

          <div className="relative z-10 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Tag className="h-4 w-4" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="text-2xl font-bold text-foreground">{categoriesCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total categories
            </p>
          </div>
        </Link>

        <div className="rounded-xl bg-white dark:bg-muted/50 h-32" />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-white dark:bg-muted/50 md:min-h-min" />
    </div>
  );
}