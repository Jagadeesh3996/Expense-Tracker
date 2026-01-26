"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { Trash, ArrowUpCircle, ArrowDownCircle, Search } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { TransactionForm } from "@/components/transaction/transaction-form"

interface Transaction {
    id: number
    transaction_date: string
    amount: number
    type: "income" | "expense"
    category: { name: string } | null
    payment_mode: { mode: string } | null
    description: string | null
    created_on: string
}

export function TransactionList() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // Pagination (Simple limit for now, can extend)
    const [limit] = useState(50)

    const supabase = createClient()

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true)

            // Note: We need to join with categories and payment_modes to show names
            const { data, error } = await supabase
                .from("transactions")
                .select(`
                    id,
                    transaction_date,
                    amount,
                    type,
                    description,
                    created_on,
                    category:categories(name),
                    payment_mode:payment_modes(mode)
                `)
                .order("transaction_date", { ascending: false })
                .order("created_on", { ascending: false })
                .limit(limit)

            if (error) throw error

            // Cast the relational data correctly
            const formattedData = (data || []).map(item => ({
                ...item,
                category: Array.isArray(item.category) ? item.category[0] : item.category,
                payment_mode: Array.isArray(item.payment_mode) ? item.payment_mode[0] : item.payment_mode
            })) as Transaction[]

            setTransactions(formattedData)
        } catch (error) {
            console.error("Error fetching transactions:", error)
            toast.error("Failed to load transactions")
        } finally {
            setLoading(false)
        }
    }, [limit, supabase])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const handleDelete = async () => {
        if (!deleteId) return

        try {
            const { error } = await supabase
                .from("transactions")
                .delete()
                .eq("id", deleteId)

            if (error) throw error

            toast.success("Transaction deleted")
            fetchTransactions() // Refresh list
        } catch (error) {
            console.error("Error deleting transaction:", error)
            toast.error("Failed to delete transaction")
        } finally {
            setDeleteId(null)
        }
    }

    const filteredTransactions = transactions.filter(t =>
        (t.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (t.category?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">

            {/* Top Section: Add Form */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">New Transaction</h2>
                <TransactionForm onSuccess={fetchTransactions} />
            </div>

            {/* List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Recent Transactions</h2>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search description or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                <div className="rounded-xl border shadow-sm bg-white dark:bg-transparent overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead className="w-[300px]">Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {format(new Date(t.transaction_date), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                                t.type === "income"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            )}>
                                                {t.type === "income" ? (
                                                    <ArrowUpCircle className="mr-1 h-3 w-3" />
                                                ) : (
                                                    <ArrowDownCircle className="mr-1 h-3 w-3" />
                                                )}
                                                {t.type === "income" ? "Income" : "Expense"}
                                            </div>
                                        </TableCell>
                                        <TableCell>{t.category?.name || "—"}</TableCell>
                                        <TableCell>{t.payment_mode?.mode || "—"}</TableCell>
                                        <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                            {t.description || "—"}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-bold font-mono",
                                            t.type === "income" ? "text-green-600" : "text-red-600"
                                        )}>
                                            {t.type === "income" ? "+" : "-"}{t.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                                onClick={() => setDeleteId(t.id)}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this transaction record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 cursor-pointer">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
