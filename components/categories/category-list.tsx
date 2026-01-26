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

interface Category {
    id: number
    name: string
    created_on: string
    updated_on: string
    user_id: string
}

export function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState({ name: "" })
    const [processing, setProcessing] = useState(false)

    const supabase = createClient()

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("created_on", { ascending: false })

            if (error) throw error
            setCategories(data || [])
        } catch (error) {
            console.error("Error fetching categories:", error)
            toast.error("Failed to load categories")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

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
                editingCategory ? cat.id !== editingCategory.id : true
            )

            if (isDuplicate) {
                toast.error(`Category "${formData.name}" already exists`)
                return
            }

            if (editingCategory) {
                // Update
                const { error } = await supabase
                    .from("categories")
                    .update({ name: formData.name.trim() })
                    .eq("id", editingCategory.id)

                if (error) throw error
                toast.success("Category updated successfully")
            } else {
                // Create
                const { error } = await supabase
                    .from("categories")
                    .insert([{ name: formData.name.trim() }])

                if (error) throw error
                toast.success("Category created successfully")
            }

            setIsOpen(false)
            setEditingCategory(null)
            setFormData({ name: "" })
            fetchCategories()
        } catch (error: any) {
            console.error("Error saving category:", error)
            toast.error(error.message || "Failed to save category")
        } finally {
            setProcessing(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", id)

            if (error) throw error

            toast.success("Category deleted")
            fetchCategories()
        } catch (error) {
            console.error("Error deleting category:", error)
            toast.error("Failed to delete category")
        }
    }

    const openEdit = (category: Category) => {
        setEditingCategory(category)
        setFormData({ name: category.name })
        setIsOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open)
                    if (!open) {
                        setEditingCategory(null)
                        setFormData({ name: "" })
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
                                    : "Add a new category to your list."}
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
                            <TableHead>Category Name</TableHead>
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
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No categories found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell>
                                        {new Date(category.created_on).toLocaleDateString()}
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
                                                <DropdownMenuItem onClick={() => openEdit(category)} className="cursor-pointer">
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(category.id)}
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
