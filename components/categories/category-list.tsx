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

interface Category {
    id: number
    name: string
    type: "income" | "expense"
    status: "active" | "inactive"
    created_on: string
    updated_on: string
    user_id: string
}

type SortDirection = "asc" | "desc" | null
type SortKey = keyof Pick<Category, "name" | "type" | "status">

export function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [paging, setPaging] = useState(false)
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [isOpen, setIsOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState<{
        name: string
        type: "income" | "expense"
        status: "active" | "inactive"
    }>({
        name: "",
        type: "expense",
        status: "active"
    })
    const [processing, setProcessing] = useState(false)

    // Using a ref to store current state for stable callback references
    const stateRef = useRef({ currentPage, limit })
    stateRef.current = { currentPage, limit }

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: SortDirection }>({
        key: null,
        direction: null
    })
    const [searchQuery, setSearchQuery] = useState("")

    const supabase = createClient()

    const from = (currentPage - 1) * limit
    const to = from + limit - 1
    const totalPages = Math.ceil(totalCount / limit)

    const fetchCategories = useCallback(async (customFrom?: number, customTo?: number) => {
        try {
            const { currentPage: cur, limit: lim } = stateRef.current
            const defaultFrom = (cur - 1) * lim
            const defaultTo = defaultFrom + lim - 1

            const rangeFrom = customFrom !== undefined ? customFrom : defaultFrom
            const rangeTo = customTo !== undefined ? customTo : defaultTo

            const { data, error, count } = await supabase
                .from("categories")
                .select("*", { count: "exact" })
                .order("created_on", { ascending: false })
                .range(rangeFrom, rangeTo)

            if (error) throw error
            return { data: data || [], count: count || 0 }
        } catch (error) {
            console.error("Error fetching categories:", error)
            toast.error("Failed to load categories")
            return null
        }
    }, [supabase])

    const loadInitialData = useCallback(async () => {
        setLoading(true)
        const result = await fetchCategories()
        if (result) {
            setCategories(result.data)
            setTotalCount(result.count)
        }
        setLoading(false)
    }, [fetchCategories])

    useEffect(() => {
        loadInitialData()
    }, [loadInitialData])

    const handlePageChange = async (newPage: number) => {
        if (newPage === currentPage || paging || newPage < 1 || newPage > totalPages) return

        const newFrom = (newPage - 1) * limit
        const newTo = newFrom + limit - 1

        setPaging(true)
        const result = await fetchCategories(newFrom, newTo)
        if (result) {
            setCategories(result.data)
            setTotalCount(result.count)
            setCurrentPage(newPage)
        }
        setPaging(false)
    }

    const handleLimitChange = async (newLimit: string) => {
        const lim = parseInt(newLimit)
        if (lim === limit || paging) return

        setPaging(true)
        // Adjust page to stay within bounds if necessary, or just reset to 1
        // Resetting to 1 is simpler and often preferred when limit changes
        const result = await fetchCategories(0, lim - 1)
        if (result) {
            setCategories(result.data)
            setTotalCount(result.count)
            setLimit(lim)
            setCurrentPage(1)
        }
        setPaging(false)
    }

    // Sort handler
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

    // Derived sorted categories
    const sortedCategories = useMemo(() => {
        let result = categories;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(cat =>
                cat.name.toLowerCase().includes(query) ||
                cat.type.toLowerCase().includes(query) ||
                cat.status.toLowerCase().includes(query)
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
    }, [categories, sortConfig, searchQuery])

    const renderSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-4 w-4" />
        if (sortConfig.direction === "asc") return <ArrowUp className="ml-2 h-4 w-4" />
        if (sortConfig.direction === "desc") return <ArrowDown className="ml-2 h-4 w-4" />
        return <ChevronsUpDown className="ml-2 h-4 w-4" />
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) return

        try {
            setProcessing(true)

            // Check for duplicates
            const { data: existingCategories, error: checkError } = await supabase
                .from("categories")
                .select("id, name")
                .ilike("name", formData.name.trim())

            if (checkError) throw checkError

            const isDuplicate = existingCategories?.some(cat =>
                editingCategory ? cat.id !== editingCategory.id && cat.name.toLowerCase() === formData.name.trim().toLowerCase() : cat.name.toLowerCase() === formData.name.trim().toLowerCase()
            )

            if (isDuplicate) {
                toast.error(`Category "${formData.name}" already exists`)
                return
            }

            if (editingCategory) {
                // Update
                const { error } = await supabase
                    .from("categories")
                    .update({
                        name: formData.name.trim(),
                        type: formData.type,
                        status: formData.status
                    })
                    .eq("id", editingCategory.id)

                if (error) throw error
                toast.success("Category updated successfully")
            } else {
                // Create
                const { error } = await supabase
                    .from("categories")
                    .insert([{
                        name: formData.name.trim(),
                        type: formData.type,
                        status: formData.status
                    }])

                if (error) throw error
                toast.success("Category created successfully")
            }

            setIsOpen(false)
            setEditingCategory(null)
            setFormData({ name: "", type: "expense", status: "active" })
            loadInitialData()
        } catch (error: any) {
            console.error("Error saving category:", error)
            toast.error(error.message || "Failed to save category")
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
                .eq("category_id", id)

            if (countError) throw countError

            if (count && count > 0) {
                toast.error("Cannot delete: Category is used in existing transactions")
                return
            }

            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", id)

            if (error) throw error

            toast.success("Category deleted")
            loadInitialData()
        } catch (error) {
            console.error("Error deleting category:", error)
            toast.error("Failed to delete category")
        }
    }

    const toggleStatus = async (category: Category) => {
        const newStatus = category.status === "active" ? "inactive" : "active"
        try {
            const { error } = await supabase
                .from("categories")
                .update({ status: newStatus })
                .eq("id", category.id)

            if (error) throw error

            toast.success(`Category marked as ${newStatus}`)
            fetchCategories()
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("Failed to update status")
        }
    }

    const openEdit = (category: Category) => {
        setEditingCategory(category)
        setFormData({
            name: category.name,
            type: category.type,
            status: category.status
        })
        setIsOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
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
                            setEditingCategory(null)
                            setFormData({ name: "", type: "expense", status: "active" })
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" /> Add New
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
                                <DialogDescription>
                                    {editingCategory
                                        ? "Make changes to your category here."
                                        : "Add a new category with type and status."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="col-span-3"
                                            placeholder="Food, Travel, etc."
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="type" className="text-right">
                                            Type
                                        </Label>
                                        <div className="col-span-3">
                                            <Select
                                                value={formData.type}
                                                onValueChange={(value: "income" | "expense") =>
                                                    setFormData({ ...formData, type: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="income" className="cursor-pointer">Income</SelectItem>
                                                    <SelectItem value="expense" className="cursor-pointer">Expense</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
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
                            <TableHead className="pl-6 w-[250px]">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("name")}
                                    className="h-8 p-0 font-bold hover:bg-transparent hover:text-current"
                                >
                                    Category Name
                                    {renderSortIcon("name")}
                                </Button>
                            </TableHead>
                            <TableHead className="w-1/4 text-center">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("type")}
                                    className="w-full h-8 p-0 font-bold hover:bg-transparent hover:text-current justify-center"
                                >
                                    Type
                                    {renderSortIcon("type")}
                                </Button>
                            </TableHead>
                            <TableHead className="w-1/4 text-center">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("status")}
                                    className="w-full h-8 p-0 font-bold hover:bg-transparent hover:text-current justify-center"
                                >
                                    Status
                                    {renderSortIcon("status")}
                                </Button>
                            </TableHead>
                            <TableHead className="w-1/4 text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader className="h-6 w-6 animate-spin text-primary" />
                                        <span className="text-sm text-muted-foreground font-medium">Loading categories...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sortedCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No categories found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedCategories.map((category) => (
                                <TableRow key={category.id} className="h-12">
                                    <TableCell className="w-1/4 font-bold pl-6">{category.name}</TableCell>
                                    <TableCell className="w-1/4 text-center">
                                        <Badge variant={category.type === "income" ? "default" : "secondary"}>
                                            {category.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="w-1/4 text-center">
                                        <Badge variant={category.status === "active" ? "outline" : "destructive"} className={category.status === "active" ? "bg-green-500/10 text-green-700 border-green-500/20" : ""}>
                                            {category.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="w-1/4 text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEdit(category)}
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
                                                            onClick={() => toggleStatus(category)}
                                                            className={`h-8 w-8 cursor-pointer hover:bg-gray-200 dark:hover:bg-muted ${category.status === 'active'
                                                                ? 'text-green-600 hover:text-green-700'
                                                                : 'text-red-600 hover:text-red-700'
                                                                }`}
                                                        >
                                                            {category.status === 'active' ? (
                                                                <CircleCheckBig className="h-4 w-4" />
                                                            ) : (
                                                                <Ban className="h-4 w-4" />
                                                            )}
                                                            <span className="sr-only">
                                                                {category.status === 'active' ? 'Deactivate' : 'Activate'}
                                                            </span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {category.status === 'active' ? 'Deactivate' : 'Activate'}
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
                                                            This action cannot be undone. This will permanently delete the category
                                                            "{category.name}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(category.id)}
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
