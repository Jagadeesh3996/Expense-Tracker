"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, SquarePen, Trash, CircleCheckBig, Ban, ArrowUp, ArrowDown, ChevronsUpDown, Search } from "lucide-react"
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
    account_number?: string
    ifsc_code?: string
    branch?: string
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

    const supabase = createClient()

    const fetchBankDetails = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("bank_details")
                .select("*")
                .order("created_on", { ascending: false })

            if (error) throw error
            setBankDetails(data || [])
        } catch (error) {
            console.error("Error fetching bank details:", error)
            toast.error("Failed to load bank details")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBankDetails()
    }, [])

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

    const sortedBankDetails = useMemo(() => {
        let result = bankDetails;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(bank =>
                bank.bank_name.toLowerCase().includes(query) ||
                bank.holder_name.toLowerCase().includes(query) ||
                (bank.account_number && bank.account_number.toLowerCase().includes(query)) ||
                bank.status.toLowerCase().includes(query)
            );
        }

        if (!sortConfig.key || !sortConfig.direction) return result

        return [...result].sort((a, b) => {
            const aValue = a[sortConfig.key!]
            const bValue = b[sortConfig.key!]

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
            return 0
        })
    }, [bankDetails, sortConfig, searchQuery])

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

            const payload = {
                bank_name: formData.bank_name.trim(),
                holder_name: formData.holder_name.trim(),
                account_number: formData.account_number.trim() || null,
                ifsc_code: formData.ifsc_code.trim() || null,
                branch: formData.branch.trim() || null,
                status: formData.status
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
            fetchBankDetails()
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
            fetchBankDetails()
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
            fetchBankDetails()
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
                            <TableHead className="w-[200px]">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("bank_name")}
                                    className="w-full h-8 p-0 font-bold hover:bg-transparent hover:text-current justify-start"
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
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : sortedBankDetails.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No bank details found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedBankDetails.map((bank) => (
                                <TableRow key={bank.id} className="h-12">
                                    <TableCell className="font-bold pl-4">{bank.bank_name}</TableCell>
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
        </div>
    )
}
