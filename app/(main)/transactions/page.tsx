import { createClient } from "@/lib/supabase/server"
import { TransactionList } from "@/components/transaction/transaction-list"
import { TransactionContainer } from "./transaction-container"

export default async function Page() {
  const supabase = await createClient()

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
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <TransactionContainer
        initialData={initialTransactions}
        initialCount={transactionsCount || 0}
      />
    </div>
  )
}