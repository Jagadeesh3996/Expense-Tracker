"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CalendarIcon, Loader2, Plus, Save } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Category {
    id: number
    name: string
}

interface PaymentMode {
    id: number
    mode: string
}

interface TransactionFormProps {
    onSuccess: () => void
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [amount, setAmount] = useState("")
    const [type, setType] = useState<"income" | "expense">("expense")
    const [categoryId, setCategoryId] = useState("")
    const [paymentModeId, setPaymentModeId] = useState("")
    const [description, setDescription] = useState("")
    const [processing, setProcessing] = useState(false)

    const [categories, setCategories] = useState<Category[]>([])
    const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([])
    const [loadingMedia, setLoadingMedia] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingMedia(true)

                // Fetch Categories
                const { data: catData, error: catError } = await supabase
                    .from("categories")
                    .select("id, name")
                    .order("name")

                if (catError) throw catError
                setCategories(catData || [])

                // Fetch Payment Modes
                const { data: modeData, error: modeError } = await supabase
                    .from("payment_modes")
                    .select("id, mode")
                    .order("mode")

                if (modeError) throw modeError
                setPaymentModes(modeData || [])

            } catch (error) {
                console.error("Error fetching master data:", error)
                toast.error("Failed to load categories or payment modes")
            } finally {
                setLoadingMedia(false)
            }
        }

        fetchData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!date) {
            toast.error("Please select a date")
            return
        }
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Please enter a valid amount")
            return
        }
        if (!categoryId) {
            toast.error("Please select a category")
            return
        }
        if (!paymentModeId) {
            toast.error("Please select a payment mode")
            return
        }

        try {
            setProcessing(true)

            const payload = {
                transaction_date: format(date, "yyyy-MM-dd"),
                amount: parseFloat(amount),
                type,
                category_id: parseInt(categoryId),
                payment_mode_id: parseInt(paymentModeId),
                description: description.trim() || null
            }

            const { error } = await supabase
                .from("transactions")
                .insert([payload])

            if (error) throw error

            toast.success("Transaction added successfully")

            // Reset form
            setAmount("")
            setDescription("")
            // We keep the date, type, category, and mode as users often enter multiple similar records

            onSuccess()

        } catch (error: any) {
            console.error("Error adding transaction:", error)
            toast.error(error.message || "Failed to add transaction")
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">

                    {/* Date Picker */}
                    <div className="flex flex-col gap-2">
                        <Label>Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal cursor-pointer",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Type Selector */}
                    <div className="flex flex-col gap-2">
                        <Label>Type</Label>
                        <div className="flex rounded-md shadow-sm">
                            <Button
                                type="button"
                                variant={type === "income" ? "default" : "outline"}
                                className={cn(
                                    "w-1/2 rounded-r-none focus:z-10 cursor-pointer",
                                    type === "income" ? "bg-green-600 hover:bg-green-700" : ""
                                )}
                                onClick={() => setType("income")}
                            >
                                Income
                            </Button>
                            <Button
                                type="button"
                                variant={type === "expense" ? "default" : "outline"}
                                className={cn(
                                    "w-1/2 rounded-l-none focus:z-10 cursor-pointer",
                                    type === "expense" ? "bg-red-600 hover:bg-red-700" : ""
                                )}
                                onClick={() => setType("expense")}
                            >
                                Expense
                            </Button>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.01"
                            min="0"
                            className="text-right font-mono"
                        />
                    </div>

                    {/* Category */}
                    <div className="flex flex-col gap-2">
                        <Label>Category</Label>
                        <Select value={categoryId} onValueChange={setCategoryId} disabled={loadingMedia}>
                            <SelectTrigger className="cursor-pointer">
                                <SelectValue placeholder={loadingMedia ? "Loading..." : "Select Category"} />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()} className="cursor-pointer">
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Mode */}
                    <div className="flex flex-col gap-2">
                        <Label>Payment Mode</Label>
                        <Select value={paymentModeId} onValueChange={setPaymentModeId} disabled={loadingMedia}>
                            <SelectTrigger className="cursor-pointer">
                                <SelectValue placeholder={loadingMedia ? "Loading..." : "Select Mode"} />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentModes.map((mode) => (
                                    <SelectItem key={mode.id} value={mode.id.toString()} className="cursor-pointer">
                                        {mode.mode}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" disabled={processing || loadingMedia} className="cursor-pointer">
                        {processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <><Plus className="mr-2 h-4 w-4" /> Add</>
                        )}
                    </Button>

                </div>

                {/* Description (Full Width row) */}
                <div className="mt-4 flex flex-col gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                        id="description"
                        placeholder="What was this for?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </form>
        </div>
    )
}
