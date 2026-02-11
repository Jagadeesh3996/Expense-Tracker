"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { ArrowDownCircle, ArrowUpCircle, CalendarIcon, Check, ChevronsUpDown, Loader2, Plus, Save } from "lucide-react"
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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Textarea } from "@/components/ui/textarea"

interface Category {
    id: number
    name: string
    type: "income" | "expense"
    status: "active" | "inactive"
}

interface PaymentMode {
    id: number
    mode: string
}

interface BankAccount {
    id: number
    bank_name: string
    holder_name: string
    account_number: string | null
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
    const [bankAccountId, setBankAccountId] = useState<string>("none")
    const [description, setDescription] = useState("")
    const [processing, setProcessing] = useState(false)

    // Popover states
    const [openCategory, setOpenCategory] = useState(false)
    const [openPaymentMode, setOpenPaymentMode] = useState(false)
    const [openBank, setOpenBank] = useState(false)

    const [categories, setCategories] = useState<Category[]>([])
    const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([])
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
    const [loadingMedia, setLoadingMedia] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingMedia(true)

                // Fetch Categories
                const { data: catData, error: catError } = await supabase
                    .from("categories")
                    .select("id, name, type, status")
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

                // Fetch Bank Accounts
                const { data: bankData, error: bankError } = await supabase
                    .from("bank_details")
                    .select("id, bank_name, holder_name, account_number")
                    .eq("status", "active")
                    .order("bank_name")

                if (bankError) throw bankError
                setBankAccounts(bankData || [])

            } catch (error) {
                console.error("Error fetching master data:", error)
                toast.error("Failed to load categories or payment modes")
            } finally {
                setLoadingMedia(false)
            }
        }

        fetchData()
    }, [])

    // Filter categories based on selected type and active status
    const filteredCategories = useMemo(() => {
        // Reset category selection if the current one is no longer valid
        // But we handle this effect separately to avoid infinite loops or clearing on initial load if valid
        return categories.filter(cat => cat.type === type && cat.status === "active");
    }, [categories, type]);

    // Clear category selection when type changes if the selected category doesn't match the new type
    useEffect(() => {
        if (categoryId) {
            const selectedCat = categories.find(c => c.id.toString() === categoryId);
            if (selectedCat && selectedCat.type !== type) {
                setCategoryId("");
            }
        }
    }, [type, categories, categoryId]);

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
                bank_account_id: bankAccountId && bankAccountId !== "none" ? parseInt(bankAccountId) : null,
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
        <div className="group/form rounded-xl border bg-card/50 backdrop-blur-xs text-card-foreground shadow-sm p-4 md:p-6 transition-all duration-300 hover:shadow-md hover:border-primary/20 hover:bg-white dark:hover:bg-card">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">

                {/* Main Grid: Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">

                    {/* Date Picker */}
                    <div className="flex flex-col gap-1.5 transition-all duration-200">
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 opacity-70">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal cursor-pointer bg-white dark:bg-transparent h-10 border-input hover:border-primary/50 hover:ring-2 hover:ring-primary/5 transition-all duration-200 shadow-xs",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="h-4 w-4 text-primary/60" />
                                    {date ? format(date, "MMMM do, yyyy") : <span>Pick a date</span>}
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

                    {/* Type Selector (Segmented Control) */}
                    <div className="flex flex-col gap-1.5 transition-all duration-200">
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 opacity-70">Type</Label>
                        <div className="flex p-0.5 bg-muted/40 rounded-lg h-10 w-full border border-input/50 backdrop-blur-xs">
                            <button
                                type="button"
                                className={cn(
                                    "flex-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                                    type === "income"
                                        ? "bg-white dark:bg-background text-green-600 shadow-sm border border-input/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                )}
                                onClick={() => setType("income")}
                            >
                                <ArrowUpCircle className={cn("h-3.5 w-3.5", type === "income" ? "text-green-600" : "text-muted-foreground/40")} />
                                Income
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "flex-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                                    type === "expense"
                                        ? "bg-white dark:bg-background text-red-600 shadow-sm border border-input/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                )}
                                onClick={() => setType("expense")}
                            >
                                <ArrowDownCircle className={cn("h-3.5 w-3.5", type === "expense" ? "text-red-600" : "text-muted-foreground/40")} />
                                Expense
                            </button>
                        </div>
                    </div>

                    {/* Category (Searchable Combobox) */}
                    <div className="flex flex-col gap-1.5 transition-all duration-200">
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 opacity-70">Category</Label>
                        <Popover open={openCategory} onOpenChange={setOpenCategory}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCategory}
                                    disabled={loadingMedia}
                                    className="w-full justify-between cursor-pointer bg-white dark:bg-transparent h-10 border-input hover:border-primary/50 hover:ring-2 hover:ring-primary/5 transition-all duration-200 font-normal shadow-xs"
                                >
                                    <span className="truncate">
                                        {categoryId
                                            ? filteredCategories.find((cat) => cat.id.toString() === categoryId)?.name
                                            : "Select Category"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search category..." className="h-9" />
                                    <CommandList>
                                        <CommandEmpty>No category found.</CommandEmpty>
                                        <CommandGroup>
                                            {filteredCategories.map((cat) => (
                                                <CommandItem
                                                    key={cat.id}
                                                    value={cat.name}
                                                    onSelect={() => {
                                                        setCategoryId(cat.id.toString())
                                                        setOpenCategory(false)
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4 text-primary",
                                                            categoryId === cat.id.toString() ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {cat.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Payment Mode (Searchable Combobox) */}
                    <div className="flex flex-col gap-1.5 transition-all duration-200">
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 opacity-70">Payment Mode</Label>
                        <Popover open={openPaymentMode} onOpenChange={setOpenPaymentMode}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openPaymentMode}
                                    disabled={loadingMedia}
                                    className="w-full justify-between cursor-pointer bg-white dark:bg-transparent h-10 border-input hover:border-primary/50 hover:ring-2 hover:ring-primary/5 transition-all duration-200 font-normal shadow-xs"
                                >
                                    <span className="truncate">
                                        {paymentModeId
                                            ? paymentModes.find((mode) => mode.id.toString() === paymentModeId)?.mode
                                            : "Select Mode"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search mode..." className="h-9" />
                                    <CommandList>
                                        <CommandEmpty>No mode found.</CommandEmpty>
                                        <CommandGroup>
                                            {paymentModes.map((mode) => (
                                                <CommandItem
                                                    key={mode.id}
                                                    value={mode.mode}
                                                    onSelect={() => {
                                                        setPaymentModeId(mode.id.toString())
                                                        setOpenPaymentMode(false)
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4 text-primary",
                                                            paymentModeId === mode.id.toString() ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {mode.mode}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col gap-1.5 transition-all duration-200">
                        <Label htmlFor="amount" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 opacity-70">Amount</Label>
                        <div className="relative group/amount">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm leading-none opacity-40 group-focus-within/amount:text-primary transition-colors">₹</span>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                step="0.01"
                                min="0"
                                className="pl-6 h-10 bg-white dark:bg-transparent border-input group-hover/amount:border-primary/50 focus-visible:ring-primary/20 transition-all duration-200 font-mono text-right shadow-xs"
                            />
                        </div>
                    </div>

                    {/* --- Row 2 (Integrated Grid) --- */}

                    {/* Bank Account (Searchable Combobox) */}
                    <div className="flex flex-col gap-1.5 transition-all duration-200">
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 opacity-70">Bank (Optional)</Label>
                        <Popover open={openBank} onOpenChange={setOpenBank}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openBank}
                                    disabled={loadingMedia}
                                    className="w-full justify-between cursor-pointer bg-white dark:bg-transparent h-10 border-input hover:border-primary/50 hover:ring-2 hover:ring-primary/5 transition-all duration-200 font-normal shadow-xs"
                                >
                                    <span className="truncate">
                                        {bankAccountId !== "none"
                                            ? bankAccounts.find((bank) => bank.id.toString() === bankAccountId)?.bank_name
                                            : "None"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search bank..." className="h-9" />
                                    <CommandList>
                                        <CommandEmpty>No bank found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="none"
                                                onSelect={() => {
                                                    setBankAccountId("none")
                                                    setOpenBank(false)
                                                }}
                                                className="cursor-pointer text-muted-foreground"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        bankAccountId === "none" ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                None
                                            </CommandItem>
                                            {bankAccounts.map((bank) => (
                                                <CommandItem
                                                    key={bank.id}
                                                    value={bank.bank_name}
                                                    onSelect={() => {
                                                        setBankAccountId(bank.id.toString())
                                                        setOpenBank(false)
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4 text-primary",
                                                            bankAccountId === bank.id.toString() ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {bank.bank_name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Description - Spans 2 cols on Mobile/Tablet, 3 on Desktop */}
                    <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3 transition-all duration-200">
                        <Label htmlFor="description" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 opacity-70">Description (Optional)</Label>
                        <Input
                            id="description"
                            placeholder="What was this for?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="h-10 bg-white dark:bg-transparent border-input hover:border-primary/50 focus-visible:ring-primary/20 transition-all duration-200 shadow-xs"
                        />
                    </div>

                    {/* Submit Action - Integrated into Row 2 */}
                    <div className="flex flex-col justify-end sm:col-span-2 lg:col-span-1">
                        <Button
                            type="submit"
                            disabled={processing || loadingMedia}
                            className="cursor-pointer h-10 w-full font-bold shadow-sm hover:translate-y-[-1px] active:translate-y-0 transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground group-hover/form:shadow-md"
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <><Plus className="mr-1.5 h-4 w-4 group-hover/form:scale-110 transition-transform" /> Add Record</>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
