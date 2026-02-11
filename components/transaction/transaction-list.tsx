"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { Trash, ArrowUpCircle, ArrowDownCircle, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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


interface Transaction {
    id: number
    transaction_date: string
    amount: number
    type: "income" | "expense"
    category: { name: string } | null
    payment_mode: { mode: string } | null
    bank_account: { bank_name: string } | null
    description: string | null
    created_on: string
}

interface TransactionListProps {
    refreshTrigger?: number
    defaultLimit?: number
    initialData?: Transaction[]
    initialCount?: number
    showTitle?: boolean
    showSearch?: boolean
}

export function TransactionList({
    refreshTrigger,
    defaultLimit = 10,
    initialData = [],
    initialCount = 0,
    showTitle = true,
    showSearch = true
}: TransactionListProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialData)
    const [loading, setLoading] = useState(initialData.length === 0)
    const [paging, setPaging] = useState(false)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [totalCount, setTotalCount] = useState(initialCount)
    const [currentPage, setCurrentPage] = useState(1)
    const [limit, setLimit] = useState(defaultLimit)

    // Use a ref to store the current state for stable callback references
    const stateRef = useRef({ currentPage, limit })
    stateRef.current = { currentPage, limit } // Update ref on each render

    const supabase = createClient()

    const from = (currentPage - 1) * limit
    const to = from + limit - 1
    const totalPages = Math.ceil(totalCount / limit)

    const fetchTransactions = useCallback(async (customFrom?: number, customTo?: number) => {
        try {
            // Use provided range or fall back to current state from ref
            const { currentPage: cur, limit: lim } = stateRef.current
            const defaultFrom = (cur - 1) * lim
            const defaultTo = defaultFrom + lim - 1

            const rangeFrom = customFrom !== undefined ? customFrom : defaultFrom
            const rangeTo = customTo !== undefined ? customTo : defaultTo

            const { data, error, count } = await supabase
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
                .range(rangeFrom, rangeTo)

            if (error) throw error

            const formattedData = (data || []).map(item => ({
                ...item,
                category: Array.isArray(item.category) ? item.category[0] : item.category,
                payment_mode: Array.isArray(item.payment_mode) ? item.payment_mode[0] : item.payment_mode,
                bank_account: Array.isArray(item.bank_account) ? item.bank_account[0] : item.bank_account
            })) as Transaction[]

            return { formattedData, count: count || 0 }
        } catch (error) {
            console.error("Error fetching transactions:", error)
            toast.error("Failed to load transactions")
            return null
        }
    }, [supabase]) // supabase is stable, so this callback is stable

    const loadInitialData = useCallback(async () => {
        setLoading(true)
        const result = await fetchTransactions()
        if (result) {
            setTransactions(result.formattedData)
            setTotalCount(result.count)
        }
        setLoading(false)
    }, [fetchTransactions])

    const isInitialMount = useRef(true)

    useEffect(() => {
        // Skip initial load if we have initial data from server
        if (isInitialMount.current && initialData && initialData.length > 0) {
            isInitialMount.current = false
            return
        }

        loadInitialData()
    }, [loadInitialData, refreshTrigger, initialData])

    const handlePageChange = async (newPage: number) => {
        if (newPage === currentPage || paging) return

        const newFrom = (newPage - 1) * limit
        const newTo = newFrom + limit - 1

        setPaging(true)
        const result = await fetchTransactions(newFrom, newTo)
        if (result) {
            setTransactions(result.formattedData)
            setTotalCount(result.count)
            setCurrentPage(newPage)
        }
        setPaging(false)
    }

    const handleLimitChange = async (newLimit: string) => {
        const value = parseInt(newLimit)
        if (isNaN(value)) return

        setLimit(value)
        setCurrentPage(1) // Reset to first page when limit changes
        setPaging(true)

        const newTo = value - 1 // Fetch for the first page with new limit
        const result = await fetchTransactions(0, newTo)
        if (result) {
            setTransactions(result.formattedData)
            setTotalCount(result.count)
        }
        setPaging(false)
    }

    const handleDelete = async () => {
        if (!deleteId) return

        try {
            const { error } = await supabase
                .from("transactions")
                .delete()
                .eq("id", deleteId)

            if (error) throw error

            toast.success("Transaction deleted")
            loadInitialData() // Refresh list
        } catch (error) {
            console.error("Error deleting transaction:", error)
            toast.error("Failed to delete transaction")
        } finally {
            setDeleteId(null)
        }
    }

    const filteredTransactions = transactions.filter(t =>
        (t.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (t.category?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (t.bank_account?.bank_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {(showTitle || showSearch) && (
                    <div className="flex items-center justify-between">
                        {showTitle && <h2 className="text-xl font-semibold tracking-tight">Recent Transactions</h2>}
                        {showSearch && (
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search, category or bank..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                    type="search"
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="rounded-xl border shadow-sm bg-white dark:bg-transparent overflow-hidden relative">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Mode & Bank</TableHead>
                                <TableHead className="w-[300px]">Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="pl-6 font-medium whitespace-nowrap">
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
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{t.payment_mode?.mode || "—"}</span>
                                                {t.bank_account && (
                                                    <span className="text-xs text-muted-foreground">{t.bank_account.bank_name}</span>
                                                )}
                                            </div>
                                        </TableCell>
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

                {/* Pagination Controls */}
                {!loading && totalCount > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
                        <div className="flex items-center gap-4 order-2 sm:order-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
                                <Select
                                    value={limit.toString()}
                                    onValueChange={handleLimitChange}
                                    disabled={paging}
                                >
                                    <SelectTrigger className="h-8 w-[70px] bg-white">
                                        <SelectValue placeholder={limit.toString()} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 20, 50, 100].map((pageSize) => (
                                            <SelectItem key={pageSize} value={pageSize.toString()}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-nowrap">
                                Showing <span className="font-medium text-foreground">{totalCount === 0 ? 0 : from + 1}</span> to{" "}
                                <span className="font-medium text-foreground">{Math.min(to + 1, totalCount)}</span> of{" "}
                                <span className="font-medium text-foreground">{totalCount}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2 order-1 sm:order-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1 || paging}
                                className="h-8 w-8 cursor-pointer bg-white"
                                title="First Page"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || paging}
                                className="h-8 w-8 cursor-pointer bg-white"
                                title="Previous Page"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center justify-center px-2 h-8 text-sm font-medium border rounded-md bg-white dark:bg-transparent min-w-[100px]">
                                Page {currentPage} of {totalPages || 1}
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={to + 1 >= totalCount || paging}
                                className="h-8 w-8 cursor-pointer bg-white"
                                title="Next Page"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(totalPages)}
                                disabled={to + 1 >= totalCount || paging}
                                className="h-8 w-8 cursor-pointer bg-white"
                                title="Last Page"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
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
