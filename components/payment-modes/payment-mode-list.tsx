"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, SquarePen, Trash, CircleCheckBig, Ban, ArrowUp, ArrowDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface PaymentMode {
    id: number
    mode: string
    status: "active" | "inactive"
    created_on: string
    updated_on: string
    user_id: string
}

type SortDirection = "asc" | "desc" | null
type SortKey = keyof Pick<PaymentMode, "mode" | "status">

export function PaymentModeList() {
    const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([])
    const [loading, setLoading] = useState(true)
    const [paging, setPaging] = useState(false)
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [isOpen, setIsOpen] = useState(false)
    const [editingMode, setEditingMode] = useState<PaymentMode | null>(null)
    const [formData, setFormData] = useState<{
        mode: string
        status: "active" | "inactive"
    }>({
        mode: "",
        status: "active"
    })
    const [processing, setProcessing] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: SortDirection }>({
        key: null,
        direction: null
    })

    const stateRef = useRef({ currentPage, limit, sortConfig, searchQuery })
    stateRef.current = { currentPage, limit, sortConfig, searchQuery }

    const supabase = createClient()

    const from = (currentPage - 1) * limit
    const to = from + limit - 1
    const totalPages = Math.ceil(totalCount / limit)

    const fetchPaymentModes = useCallback(async (customFrom?: number, customTo?: number) => {
        try {
            const { currentPage: cur, limit: lim, sortConfig: sort, searchQuery: query } = stateRef.current
            const defaultFrom = (cur - 1) * lim
            const defaultTo = defaultFrom + lim - 1

            const rangeFrom = customFrom !== undefined ? customFrom : defaultFrom
            const rangeTo = customTo !== undefined ? customTo : defaultTo

            let dbQuery = supabase
                .from("payment_modes")
                .select("*", { count: "exact" })

            if (query) {
                dbQuery = dbQuery.ilike("mode", `%${query}%`)
            }

            if (sort.key && sort.direction) {
                dbQuery = dbQuery.order(sort.key, { ascending: sort.direction === "asc" })
            } else {
                dbQuery = dbQuery.order("created_on", { ascending: false })
            }

            const { data, error, count } = await dbQuery.range(rangeFrom, rangeTo)

            if (error) throw error
            return { data: data || [], count: count || 0 }
        } catch (error) {
            console.error("Error fetching payment modes:", error)
            toast.error("Failed to load payment modes")
            return null
        }
    }, [supabase])

    const loadInitialData = useCallback(async () => {
        setLoading(true)
        const result = await fetchPaymentModes()
        if (result) {
            setPaymentModes(result.data)
            setTotalCount(result.count)
        }
        setLoading(false)
    }, [fetchPaymentModes])

    useEffect(() => {
        loadInitialData()
    }, [loadInitialData])

    // Fetch on search/sort changes (silent if already loaded)
    useEffect(() => {
        if (!loading) {
            loadInitialData()
        }
    }, [sortConfig, searchQuery])

    const handlePageChange = async (newPage: number) => {
        if (newPage === currentPage || paging || newPage < 1 || newPage > totalPages) return

        const newFrom = (newPage - 1) * limit
        const newTo = newFrom + limit - 1

        setPaging(true)
        const result = await fetchPaymentModes(newFrom, newTo)
        if (result) {
            setPaymentModes(result.data)
            setTotalCount(result.count)
            setCurrentPage(newPage)
        }
        setPaging(false)
    }

    const handleLimitChange = async (newLimit: string) => {
        const lim = parseInt(newLimit)
        if (lim === limit || paging) return

        setPaging(true)
        const result = await fetchPaymentModes(0, lim - 1)
        if (result) {
            setPaymentModes(result.data)
            setTotalCount(result.count)
            setLimit(lim)
            setCurrentPage(1)
        }
        setPaging(false)
    }

    const handleSort = (key: SortKey) => {
        setSortConfig((current) => {
            if (current.key === key) {
                if (current.direction === "asc") return { key, direction: "desc" }
                if (current.direction === "desc") return { key: null, direction: null }
                return { key: null, direction: null }
            }
            return { key, direction: "asc" }
        })
    }


    const renderSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-4 w-4" />
        if (sortConfig.direction === "asc") return <ArrowUp className="ml-2 h-4 w-4" />
        if (sortConfig.direction === "desc") return <ArrowDown className="ml-2 h-4 w-4" />
        return <ChevronsUpDown className="ml-2 h-4 w-4" />
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.mode.trim()) return

        try {
            setProcessing(true)

            // Check for duplicates
            const { data: existingModes, error: checkError } = await supabase
                .from("payment_modes")
                .select("id, mode")
                .ilike("mode", formData.mode.trim())

            if (checkError) throw checkError

            const isDuplicate = existingModes?.some(mode =>
                editingMode
                    ? mode.id !== editingMode.id && mode.mode.toLowerCase() === formData.mode.trim().toLowerCase()
                    : mode.mode.toLowerCase() === formData.mode.trim().toLowerCase()
            )

            if (isDuplicate) {
                toast.error(`Payment mode "${formData.mode}" already exists`)
                return
            }

            if (editingMode) {
                // Update
                const { error } = await supabase
                    .from("payment_modes")
                    .update({
                        mode: formData.mode.trim(),
                        status: formData.status
                    })
                    .eq("id", editingMode.id)

                if (error) throw error
                toast.success("Payment mode updated successfully")
            } else {
                // Create
                const { error } = await supabase
                    .from("payment_modes")
                    .insert([{
                        mode: formData.mode.trim(),
                        status: formData.status
                    }])

                if (error) throw error
                toast.success("Payment mode created successfully")
            }

            setIsOpen(false)
            setEditingMode(null)
            setFormData({ mode: "", status: "active" })
            loadInitialData()
        } catch (error: any) {
            console.error("Error saving payment mode:", error)
            toast.error(error.message || "Failed to save payment mode")
        } finally {
            setProcessing(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            // Check if used in transactions
            const { count, error: countError } = await supabase
                .from("transactions")
                .select("*", { count: 'exact', head: true })
                .eq("payment_mode_id", id)

            if (countError) throw countError

            if (count && count > 0) {
                toast.error("Cannot delete: Payment mode is used in existing transactions")
                return
            }

            const { error } = await supabase
                .from("payment_modes")
                .delete()
                .eq("id", id)

            if (error) throw error

            toast.success("Payment mode deleted")
            loadInitialData()
        } catch (error) {
            console.error("Error deleting payment mode:", error)
            toast.error("Failed to delete payment mode")
        }
    }

    const toggleStatus = async (mode: PaymentMode) => {
        const newStatus = mode.status === "active" ? "inactive" : "active"
        try {
            const { error } = await supabase
                .from("payment_modes")
                .update({ status: newStatus })
                .eq("id", mode.id)

            if (error) throw error

            toast.success(`Payment mode marked as ${newStatus}`)
            loadInitialData()
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("Failed to update status")
        }
    }

    const openEdit = (mode: PaymentMode) => {
        setEditingMode(mode)
        setFormData({
            mode: mode.mode,
            status: mode.status
        })
        setIsOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Payment Modes</h2>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="w-full rounded-lg bg-white pl-8 md:w-[200px] lg:w-[320px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Dialog open={isOpen} onOpenChange={(open) => {
                        setIsOpen(open)
                        if (!open) {
                            setEditingMode(null)
                            setFormData({ mode: "", status: "active" })
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" /> Add New
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingMode ? "Edit Payment Mode" : "Add Payment Mode"}</DialogTitle>
                                <DialogDescription>
                                    {editingMode
                                        ? "Make changes to your payment mode here."
                                        : "Add a new payment mode with a status."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="mode" className="text-right">
                                            Name
                                        </Label>
                                        <Input
                                            id="mode"
                                            value={formData.mode}
                                            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                                            className="col-span-3"
                                            placeholder="Cash, Credit Card, etc."
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="status" className="text-right">
                                            Status
                                        </Label>
                                        <div className="col-span-3">
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value: "active" | "inactive") =>
                                                    setFormData({ ...formData, status: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active" className="cursor-pointer">Active</SelectItem>
                                                    <SelectItem value="inactive" className="cursor-pointer">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={processing} className="cursor-pointer">
                                        {processing ? "Saving..." : "Save changes"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-xl border shadow-sm bg-white dark:bg-transparent overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6 w-1/3">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("mode")}
                                    className="h-8 p-0 font-bold hover:bg-transparent"
                                >
                                    Mode Name
                                    {renderSortIcon("mode")}
                                </Button>
                            </TableHead>
                            <TableHead className="w-1/3 text-center">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("status")}
                                    className="w-full h-8 p-0 font-bold hover:bg-transparent hover:text-current justify-center"
                                >
                                    Status
                                    {renderSortIcon("status")}
                                </Button>
                            </TableHead>
                            <TableHead className="w-1/3 text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : paymentModes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No payment modes found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paymentModes.map((mode) => (
                                <TableRow key={mode.id} className="h-12">
                                    <TableCell className="pl-6 w-1/3 font-bold">{mode.mode}</TableCell>
                                    <TableCell className="w-1/3 text-center">
                                        <Badge variant={mode.status === "active" ? "outline" : "destructive"} className={mode.status === "active" ? "bg-green-500/10 text-green-700 border-green-500/20" : ""}>
                                            {mode.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="w-1/3 text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEdit(mode)}
                                                            className="h-8 w-8 cursor-pointer hover:bg-gray-200 dark:hover:bg-muted text-muted-foreground hover:text-muted-foreground"
                                                        >
                                                            <SquarePen className="h-4 w-4" />
                                                            <span className="sr-only">Edit</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleStatus(mode)}
                                                            className={`h-8 w-8 cursor-pointer hover:bg-gray-200 dark:hover:bg-muted ${mode.status === 'active'
                                                                ? 'text-green-600 hover:text-green-700'
                                                                : 'text-red-600 hover:text-red-700'
                                                                }`}
                                                        >
                                                            {mode.status === 'active' ? (
                                                                <CircleCheckBig className="h-4 w-4" />
                                                            ) : (
                                                                <Ban className="h-4 w-4" />
                                                            )}
                                                            <span className="sr-only">
                                                                {mode.status === 'active' ? 'Deactivate' : 'Activate'}
                                                            </span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {mode.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <AlertDialog>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                    <span className="sr-only">Delete</span>
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Delete</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the payment mode
                                                            "{mode.mode}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(mode.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {!loading && totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 bg-muted/20 rounded-lg border mt-4">
                    <div className="flex items-center gap-4 order-2 sm:order-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
                            <Select
                                value={limit.toString()}
                                onValueChange={handleLimitChange}
                                disabled={paging}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
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
                            className="h-8 w-8 cursor-pointer"
                            title="First Page"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || paging}
                            className="h-8 w-8 cursor-pointer"
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
                            className="h-8 w-8 cursor-pointer"
                            title="Next Page"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePageChange(totalPages)}
                            disabled={to + 1 >= totalCount || paging}
                            className="h-8 w-8 cursor-pointer"
                            title="Last Page"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
