import { SilentLink } from "@/components/ui/silent-link";
import { createClient } from "@/lib/supabase/server";
import { CreditCard, Tag, TrendingDown } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { TransactionList } from "@/components/transaction/transaction-list";

export default async function Page() {
  const supabase = await createClient();

  // Get current month range
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const { count: paymentModesCount } = await supabase
    .from("payment_modes")
    .select("*", { count: "exact", head: true });

  const { count: categoriesCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });

  // Fetch this month's expenses sum
  const { data: expenseData } = await supabase
    .from("transactions")
    .select("amount")
    .eq("type", "expense")
    .gte("transaction_date", monthStart)
    .lte("transaction_date", monthEnd);

  const totalMonthlyExpense = expenseData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

  // Fetch initial transactions for the list
  const { data: transactionsData, count: transactionsCount } = await supabase
    .from("transactions")
    .select(`
        id,
        transaction_date,
        amount,
        type,
        description,
        created_on,
        category:categories(name),
        payment_mode:payment_modes(mode),
        bank_account:bank_details(bank_name)
    `, { count: "exact" })
    .order("transaction_date", { ascending: false })
    .order("created_on", { ascending: false })
    .range(0, 9);

  const initialTransactions = (transactionsData || []).map((item: any) => ({
    ...item,
    category: Array.isArray(item.category) ? item.category[0] : item.category,
    payment_mode: Array.isArray(item.payment_mode) ? item.payment_mode[0] : item.payment_mode,
    bank_account: Array.isArray(item.bank_account) ? item.bank_account[0] : item.bank_account,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {/* Payment Modes Card */}
        <SilentLink
          href="/payment-modes"
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
        </SilentLink>

        {/* Categories Card */}
        <SilentLink
          href="/categories"
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
        </SilentLink>

        {/* This Month Expense Card */}
        <SilentLink
          href="/transactions"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-muted/50 dark:shadow-none h-32 cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl transition-all group-hover:bg-rose-500/20" />

          <div className="relative z-10 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">This Month Expense</h3>
            <div className="rounded-full bg-rose-50 p-2 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="text-2xl font-bold text-foreground">
              ₹{totalMonthlyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current month spending
            </p>
          </div>
        </SilentLink>
      </div>
      <TransactionList
        defaultLimit={10}
        initialData={initialTransactions}
        initialCount={transactionsCount || 0}
        showTitle={false}
        showSearch={false}
      />
    </div>
  );
}