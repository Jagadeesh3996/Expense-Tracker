"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PaymentMode {
    id: number
    mode: string
    created_on: string
    updated_on: string
    user_id: string
}

export function PaymentModeList() {
    const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const [editingMode, setEditingMode] = useState<PaymentMode | null>(null)
    const [formData, setFormData] = useState({ mode: "" })
    const [processing, setProcessing] = useState(false)

    const supabase = createClient()

    const fetchPaymentModes = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("payment_modes")
                .select("*")
                .order("created_on", { ascending: false })

            if (error) throw error
            setPaymentModes(data || [])
        } catch (error) {
            console.error("Error fetching payment modes:", error)
            toast.error("Failed to load payment modes")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPaymentModes()
    }, [])

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
                editingMode ? mode.id !== editingMode.id : true
            )

            if (isDuplicate) {
                toast.error(`Payment mode "${formData.mode}" already exists`)
                return
            }

            if (editingMode) {
                // Update
                const { error } = await supabase
                    .from("payment_modes")
                    .update({ mode: formData.mode.trim() })
                    .eq("id", editingMode.id)

                if (error) throw error
                toast.success("Payment mode updated successfully")
            } else {
                // Create
                const { error } = await supabase
                    .from("payment_modes")
                    .insert([{ mode: formData.mode.trim() }])

                if (error) throw error
                toast.success("Payment mode created successfully")
            }

            setIsOpen(false)
            setEditingMode(null)
            setFormData({ mode: "" })
            fetchPaymentModes()
        } catch (error: any) {
            console.error("Error saving payment mode:", error)
            toast.error(error.message || "Failed to save payment mode")
        } finally {
            setProcessing(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const { error } = await supabase
                .from("payment_modes")
                .delete()
                .eq("id", id)

            if (error) throw error

            toast.success("Payment mode deleted")
            fetchPaymentModes()
        } catch (error) {
            console.error("Error deleting payment mode:", error)
            toast.error("Failed to delete payment mode")
        }
    }

    const openEdit = (mode: PaymentMode) => {
        setEditingMode(mode)
        setFormData({ mode: mode.mode })
        setIsOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Payment Modes</h2>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open)
                    if (!open) {
                        setEditingMode(null)
                        setFormData({ mode: "" })
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
                                    : "Add a new payment mode to your list."}
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

            <div className="rounded-xl border shadow-sm bg-white dark:bg-transparent overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mode Name</TableHead>
                            <TableHead>Created On</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                                <TableRow key={mode.id}>
                                    <TableCell className="font-medium">{mode.mode}</TableCell>
                                    <TableCell>
                                        {new Date(mode.created_on).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => openEdit(mode)} className="cursor-pointer">
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(mode.id)}
                                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
