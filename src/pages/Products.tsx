import { useState } from 'react'
import { Package, Plus, Edit2, Trash2, Tag, DollarSign } from 'lucide-react'

import { useStore } from '../store/store'
import { type Product } from '../types'
import { Card, Button, Input, Label, Select } from '../components/ui'

const CATEGORIES: Product['category'][] = [
    'Evaluation',
    'Workout Template',
    'Digital Product',
    'Other',
]

const categoryColors: Record<Product['category'], string> = {
    Evaluation: 'bg-blue-100 text-blue-700',
    'Workout Template': 'bg-purple-100 text-purple-700',
    'Digital Product': 'bg-green-100 text-green-700',
    Other: 'bg-slate-100 text-slate-600',
}

const emptyForm = (): Omit<Product, 'id'> => ({
    name: '',
    price: 0,
    category: 'Other',
})

interface ProductModalProps {
    initial: Omit<Product, 'id'> | null
    onSave: (data: Omit<Product, 'id'>) => void
    onClose: () => void
}

const ProductModal = ({ initial, onSave, onClose }: ProductModalProps) => {
    const [form, setForm] = useState<Omit<Product, 'id'>>(initial ?? emptyForm())

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(form)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                    {initial ? 'Edit Product' : 'New Product'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="prod-name">Name</Label>
                        <Input
                            id="prod-name"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Personalized Evaluation"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="prod-category">Category</Label>
                        <Select
                            id="prod-category"
                            value={form.category}
                            onChange={(e) =>
                                setForm({ ...form, category: e.target.value as Product['category'] })
                            }
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="prod-price">Price (R$)</Label>
                        <Input
                            id="prod-price"
                            type="number"
                            min={0}
                            step={0.01}
                            required
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {initial ? 'Save Changes' : 'Create Product'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

export const Products = () => {
    const { products, addProduct, updateProduct, deleteProduct } = useStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editing, setEditing] = useState<Product | null>(null)

    const handleCreate = () => {
        setEditing(null)
        setIsModalOpen(true)
    }

    const handleEdit = (product: Product) => {
        setEditing(product)
        setIsModalOpen(true)
    }

    const handleDelete = (id: string) => {
        if (window.confirm('Delete this product?')) {
            deleteProduct(id)
        }
    }

    const handleSave = (data: Omit<Product, 'id'>) => {
        if (editing) {
            updateProduct(editing.id, data)
        } else {
            addProduct(data)
        }
        setIsModalOpen(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Products & Services</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage your offerings — evaluations, programs, and digital products.
                    </p>
                </div>
                <Button onClick={handleCreate} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Product
                </Button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CATEGORIES.map((cat) => {
                    const count = products.filter((p) => p.category === cat).length
                    return (
                        <Card key={cat} className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${categoryColors[cat]}`}>
                                <Tag className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{count}</p>
                                <p className="text-xs text-slate-500 leading-tight">{cat}</p>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Product Grid */}
            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <div className="bg-slate-100 p-5 rounded-full mb-4">
                        <Package className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="text-lg font-semibold text-slate-600">No products yet</p>
                    <p className="text-sm mt-1">Click "New Product" to add your first offering.</p>
                    <Button onClick={handleCreate} className="mt-5 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> New Product
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {products.map((product) => (
                        <Card key={product.id} className="p-5 flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="bg-indigo-50 p-2.5 rounded-lg">
                                    <Package className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-900 text-base leading-snug">{product.name}</h3>
                                <span
                                    className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[product.category]}`}
                                >
                                    {product.category}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-lg">
                                <DollarSign className="h-4 w-4 text-slate-400" />
                                {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </Card>
                    ))}

                    {/* Add card button */}
                    <button
                        onClick={handleCreate}
                        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all group min-h-[180px]"
                    >
                        <div className="bg-slate-100 p-3 rounded-full mb-2 group-hover:bg-white shadow-sm transition-all">
                            <Plus className="h-5 w-5" />
                        </div>
                        <span className="font-medium">Add Product</span>
                    </button>
                </div>
            )}

            {isModalOpen && (
                <ProductModal
                    initial={editing ? { name: editing.name, price: editing.price, category: editing.category } : null}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    )
}
