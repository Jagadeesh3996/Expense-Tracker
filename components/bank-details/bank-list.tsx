"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, SquarePen, Trash, CircleCheckBig, Ban, ArrowUp, ArrowDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader } from "lucide-react"
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

interface BankDetail {
    id: number
    bank_name: string
    holder_name: string
    account_number: string | null
    ifsc_code: string | null
    branch: string | null
    status: "active" | "inactive"
    created_on: string
    updated_on: string
    user_id: string
}

type SortDirection = "asc" | "desc" | null
type SortKey = keyof Pick<BankDetail, "bank_name" | "holder_name" | "status">

export function BankList() {
    const [bankDetails, setBankDetails] = useState<BankDetail[]>([])
    const [loading, setLoading] = useState(true)
    const [paging, setPaging] = useState(false)
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [isOpen, setIsOpen] = useState(false)
    const [editingBank, setEditingBank] = useState<BankDetail | null>(null)
    const [formData, setFormData] = useState<{
        bank_name: string
        holder_name: string
        account_number: string
        ifsc_code: string
        branch: string
        status: "active" | "inactive"
    }>({
        bank_name: "",
        holder_name: "",
        account_number: "",
        ifsc_code: "",
        branch: "",
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

    const fetchBankDetails = useCallback(async (customFrom?: number, customTo?: number) => {
        try {
            const { currentPage: cur, limit: lim, sortConfig: sort, searchQuery: query } = stateRef.current
            const defaultFrom = (cur - 1) * lim
            const defaultTo = defaultFrom + lim - 1

            const rangeFrom = customFrom !== undefined ? customFrom : defaultFrom
            const rangeTo = customTo !== undefined ? customTo : defaultTo

            let dbQuery = supabase
                .from("bank_details")
                .select("*", { count: "exact" })

            if (query) {
                dbQuery = dbQuery.or(`bank_name.ilike.%${query}%,holder_name.ilike.%${query}%,account_number.ilike.%${query}%`)
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
            console.error("Error fetching bank details:", error)
            toast.error("Failed to load bank details")
            return null
        }
    }, [supabase])

    const loadInitialData = useCallback(async () => {
        setLoading(true)
        const result = await fetchBankDetails()
        if (result) {
            setBankDetails(result.data)
            setTotalCount(result.count)
        }
        setLoading(false)
    }, [fetchBankDetails])

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
        const result = await fetchBankDetails(newFrom, newTo)
        if (result) {
            setBankDetails(result.data)
            setTotalCount(result.count)
            setCurrentPage(newPage)
        }
        setPaging(false)
    }

    const handleLimitChange = async (newLimit: string) => {
        const lim = parseInt(newLimit)
        if (lim === limit || paging) return

        setPaging(true)
        const result = await fetchBankDetails(0, lim - 1)
        if (result) {
            setBankDetails(result.data)
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
        if (!formData.bank_name.trim() || !formData.holder_name.trim()) {
            toast.error("Bank Name and Holder Name are required")
            return
        }

        try {
            setProcessing(true)

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error("You must be logged in to manage bank details")
                return
            }

            const payload = {
                bank_name: formData.bank_name.trim(),
                holder_name: formData.holder_name.trim(),
                account_number: formData.account_number.trim() || null,
                ifsc_code: formData.ifsc_code.trim() || null,
                branch: formData.branch.trim() || null,
                status: formData.status,
                user_id: user.id
            }

            if (editingBank) {
                // Update
                const { error } = await supabase
                    .from("bank_details")
                    .update(payload)
                    .eq("id", editingBank.id)

                if (error) throw error
                toast.success("Bank details updated successfully")
            } else {
                // Create
                const { error } = await supabase
                    .from("bank_details")
                    .insert([payload])

                if (error) throw error
                toast.success("Bank details added successfully")
            }

            setIsOpen(false)
            setEditingBank(null)
            setFormData({
                bank_name: "",
                holder_name: "",
                account_number: "",
                ifsc_code: "",
                branch: "",
                status: "active"
            })
            loadInitialData()
        } catch (error: any) {
            console.error("Error saving bank details:", error)
            toast.error(error.message || "Failed to save bank details")
        } finally {
            setProcessing(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const { error } = await supabase
                .from("bank_details")
                .delete()
                .eq("id", id)

            if (error) throw error

            toast.success("Bank details deleted")
            loadInitialData()
        } catch (error) {
            console.error("Error deleting bank details:", error)
            toast.error("Failed to delete bank details")
        }
    }

    const toggleStatus = async (bank: BankDetail) => {
        const newStatus = bank.status === "active" ? "inactive" : "active"
        try {
            const { error } = await supabase
                .from("bank_details")
                .update({ status: newStatus })
                .eq("id", bank.id)

            if (error) throw error

            toast.success(`Bank marked as ${newStatus}`)
            loadInitialData()
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("Failed to update status")
        }
    }

    const openEdit = (bank: BankDetail) => {
        setEditingBank(bank)
        setFormData({
            bank_name: bank.bank_name,
            holder_name: bank.holder_name,
            account_number: bank.account_number || "",
            ifsc_code: bank.ifsc_code || "",
            branch: bank.branch || "",
            status: bank.status
        })
        setIsOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Bank Details</h2>
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
                            setEditingBank(null)
                            setFormData({
                                bank_name: "",
                                holder_name: "",
                                account_number: "",
                                ifsc_code: "",
                                branch: "",
                                status: "active"
                            })
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" /> Add New
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{editingBank ? "Edit Bank Details" : "Add Bank Details"}</DialogTitle>
                                <DialogDescription>
                                    {editingBank
                                        ? "Update your bank account information."
                                        : "Add a new bank account for your records."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="bank_name" className="text-right">
                                            Bank Name *
                                        </Label>
                                        <Input
                                            id="bank_name"
                                            value={formData.bank_name}
                                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                            className="col-span-3"
                                            placeholder="e.g. HDFC Bank"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="holder_name" className="text-right">
                                            Holder Name *
                                        </Label>
                                        <Input
                                            id="holder_name"
                                            value={formData.holder_name}
                                            onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
                                            className="col-span-3"
                                            placeholder="e.g. John Doe"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="account_number" className="text-right">
                                            Account No
                                        </Label>
                                        <Input
                                            id="account_number"
                                            value={formData.account_number}
                                            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                            className="col-span-3"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="ifsc_code" className="text-right">
                                            IFSC Code
                                        </Label>
                                        <Input
                                            id="ifsc_code"
                                            value={formData.ifsc_code}
                                            onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                                            className="col-span-3"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="branch" className="text-right">
                                            Branch
                                        </Label>
                                        <Input
                                            id="branch"
                                            value={formData.branch}
                                            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                            className="col-span-3"
                                            placeholder="Optional"
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
                            <TableHead className="pl-6 w-[200px]">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("bank_name")}
                                    className="h-8 p-0 font-bold hover:bg-transparent hover:text-current"
                                >
                                    Bank Name
                                    {renderSortIcon("bank_name")}
                                </Button>
                            </TableHead>
                            <TableHead className="w-[200px]">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("holder_name")}
                                    className="w-full h-8 p-0 font-bold hover:bg-transparent hover:text-current justify-start"
                                >
                                    Holder Name
                                    {renderSortIcon("holder_name")}
                                </Button>
                            </TableHead>
                            <TableHead className="hidden md:table-cell">Account No</TableHead>
                            <TableHead className="hidden lg:table-cell">Branch</TableHead>
                            <TableHead className="w-[100px] text-center">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("status")}
                                    className="w-full h-8 p-0 font-bold hover:bg-transparent hover:text-current justify-center"
                                >
                                    Status
                                    {renderSortIcon("status")}
                                </Button>
                            </TableHead>
                            <TableHead className="w-[100px] text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader className="h-6 w-6 animate-spin text-primary" />
                                        <span className="text-sm text-muted-foreground font-medium">Loading bank accounts...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : bankDetails.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No bank details found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            bankDetails.map((bank) => (
                                <TableRow key={bank.id} className="h-12">
                                    <TableCell className="pl-6 font-bold">{bank.bank_name}</TableCell>
                                    <TableCell>{bank.holder_name}</TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground font-mono">
                                        {bank.account_number || "-"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                                        {bank.branch || "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={bank.status === "active" ? "outline" : "destructive"} className={bank.status === "active" ? "bg-green-500/10 text-green-700 border-green-500/20" : ""}>
                                            {bank.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEdit(bank)}
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
                                                            onClick={() => toggleStatus(bank)}
                                                            className={`h-8 w-8 cursor-pointer hover:bg-gray-200 dark:hover:bg-muted ${bank.status === 'active'
                                                                ? 'text-green-600 hover:text-green-700'
                                                                : 'text-red-600 hover:text-red-700'
                                                                }`}
                                                        >
                                                            {bank.status === 'active' ? (
                                                                <CircleCheckBig className="h-4 w-4" />
                                                            ) : (
                                                                <Ban className="h-4 w-4" />
                                                            )}
                                                            <span className="sr-only">
                                                                {bank.status === 'active' ? 'Deactivate' : 'Activate'}
                                                            </span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {bank.status === 'active' ? 'Deactivate' : 'Activate'}
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
                                                            This action cannot be undone. This will permanently delete the bank details for
                                                            "{bank.bank_name}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(bank.id)}
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 mt-4">
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
    )
}
