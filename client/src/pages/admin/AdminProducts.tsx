// ============================================================
// pages/admin/AdminProducts.tsx
// Admin product management — full CRUD:
// - View all products in a table
// - Create a new product (modal form)
// - Edit an existing product (modal form, pre-filled)
// - Delete a product (with confirmation)
// - Upload product images to Cloudinary
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { MdAdd, MdEdit, MdDelete, MdUpload } from "react-icons/md";
import type { Product } from "../../types";
import api from "../../Services/api";
import toast from "react-hot-toast";
import { useStore } from "../../context/StoreContext";
import { formatPriceInput, parsePriceInput } from "../../utils/priceInput";

// ---- Product Form State ----
interface ProductForm {
  name: string;
  category: "headphones" | "speakers" | "earphones";
  price: string; // String for input, converted to number on submit
  image: string;
  description: string;
  features: string;
  inTheBox: { quantity: string; item: string }[];
  gallery: string[];
  isNewArrival: boolean;
}

const emptyForm: ProductForm = {
  name: "",
  category: "headphones",
  price: "",
  image: "",
  description: "",
  features: "",
  inTheBox: [{ quantity: "1", item: "" }],
  gallery: ["", "", ""],
  isNewArrival: false,
};

const AdminProducts: React.FC = () => {
  const { upsertProduct, removeProduct } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const input = event.currentTarget;
    const raw = parsePriceInput(input.value);
    if (raw === null) return;
    const logicalCursor = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/,/g, "").length;
    const formatted = formatPriceInput(raw);
    setForm((prev) => ({ ...prev, price: raw }));
    requestAnimationFrame(() => {
      let cursor = 0;
      let characters = 0;
      while (cursor < formatted.length && characters < logicalCursor) {
        if (formatted[cursor] !== ",") characters++;
        cursor++;
      }
      input.setSelectionRange(cursor, cursor);
    });
  };

  // Ref for the image file input
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch all products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (): Promise<void> => {
    try {
      const { data } = await api.get<Product[]>("/products");
      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Open modal for creating a new product
  const openCreateModal = (): void => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  // Open modal for editing an existing product
  const openEditModal = (product: Product): void => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      image: product.image,
      description: product.description,
      features: product.features,
      inTheBox: product.inTheBox.map((b) => ({
        quantity: b.quantity.toString(),
        item: b.item,
      })),
      gallery: [
        product.gallery[0] || "",
        product.gallery[1] || "",
        product.gallery[2] || "",
      ],
      isNewArrival: product.isNewArrival,
    });
    setShowModal(true);
  };

  // Upload an image to Cloudinary via the backend
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await api.post<{ url: string }>(
        "/admin/products/upload-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      // Set the returned Cloudinary URL as the product image
      setForm((prev) => ({ ...prev, image: data.url }));
      toast.success("Image uploaded!");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Save the product (create or update)
  const handleSave = async (): Promise<void> => {
    // Validate required fields
    if (!form.name.trim() || !form.price || !form.description.trim() || !form.image.trim() || !form.features.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: form.name,
        category: form.category,
        price: Number(form.price), // Raw state has no display commas
        image: form.image,
        description: form.description,
        features: form.features,
        inTheBox: form.inTheBox.map((b) => ({
          quantity: parseInt(b.quantity),
          item: b.item,
        })),
        gallery: form.gallery.filter((g) => g.trim() !== ""),
        isNewArrival: form.isNewArrival,
      };

      if (editingProduct) {
        // PUT /api/admin/products/:id
        const { data } = await api.patch<Product>(`/admin/products/${editingProduct._id}`, payload);
        upsertProduct(data);
        toast.success("Product updated!");
      } else {
        // POST /api/admin/products
        const { data } = await api.post<Product>("/admin/products", payload);
        upsertProduct(data);
        toast.success("Product created!");
      }

      setShowModal(false);
      fetchProducts(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a product
  const handleDelete = async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/products/${id}`);
      removeProduct(id);
      toast.success("Product deleted");
      setDeleteConfirm(null);
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  // Update an "in the box" row
  const updateBoxItem = (
    index: number,
    field: "quantity" | "item",
    value: string,
  ): void => {
    const updated = [...form.inTheBox];
    updated[index] = { ...updated[index], [field]: value };
    setForm((prev) => ({ ...prev, inTheBox: updated }));
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-2xl md:text-3xl text-black">Products</h1>
        <button
          onClick={openCreateModal}
          className="admin-button admin-button--primary flex items-center gap-2 bg-[#D87D4A] text-white font-bold text-[13px] tracking-[1px] uppercase py-4 px-8 hover:bg-[#FBAF85] transition-colors cursor-pointer duration-200 disabled:opacity-60  "
        >
          <MdAdd className="text-lg" />
          Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {["Image", "Name", "Category", "Price", "New?", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-bold text-black/50 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-black/40"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-black/40"
                  >
                    No products yet. Create your first product!
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Product thumbnail */}
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 bg-[#F1F1F1] rounded-lg flex items-center justify-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-8 h-8 object-contain"
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm text-black max-w-50">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-black capitalize">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-black">
                      ₦ {product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          product.isNewArrival
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {product.isNewArrival ? "New" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          aria-label={"Edit " + product.name}
                          title="Edit product"
                          onClick={() => openEditModal(product)}
                          className="admin-button admin-button--edit admin-button--icon w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"
                        >
                          <MdEdit className="text-sm" />
                        </button>
                        <button
                          aria-label={"Delete " + product.name}
                          title="Delete product"
                          onClick={() => setDeleteConfirm(product._id)}
                          className="admin-button admin-button--danger-soft admin-button--icon w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <MdDelete className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Create/Edit Modal ===== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-175 p-8 animate-fadeIn my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-xl text-black mb-6">
              {editingProduct ? "Edit Product" : "Create New Product"}
            </h2>

            <div className="flex flex-col gap-5">
              {/* Name + Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-name" className="text-xs font-bold text-black mb-2 block">
                    Product Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    id="product-name"
                    className="input-field"
                    placeholder="XX99 Mark II Headphones"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black mb-2 block">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        category: e.target.value as ProductForm["category"],
                      }))
                    }
                    className="w-full border border-[#CFCFCF] rounded-lg px-4 py-3 text-sm font-bold text-black outline-none focus:border-[#D87D4A] transition-colors"
                  >
                    <option value="headphones">Headphones</option>
                    <option value="speakers">Speakers</option>
                    <option value="earphones">Earphones</option>
                  </select>
                </div>
              </div>

              {/* Price + New badge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-price" className="text-xs font-bold text-black mb-2 block">
                    Price (₦) *
                  </label>
                  <input
                    id="product-price"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={formatPriceInput(form.price)}
                    onChange={handlePriceChange}
                    className="w-full border border-[#CFCFCF] rounded-lg px-4 py-3 text-sm font-bold text-black outline-none focus:border-[#D87D4A] transition-colors"
                    placeholder="85,000"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="isNewArrival"
                    checked={form.isNewArrival}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isNewArrival: e.target.checked }))
                    }
                    className="w-4 h-4 accent-[#D87D4A]"
                  />
                  <label
                    htmlFor="isNewArrival"
                    className="text-sm font-bold text-black"
                  >
                    Mark as "New Product"
                  </label>
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="text-xs font-bold text-black mb-2 block">
                  Main Product Image
                </label>
                <div className="flex gap-3">
                  <input
                    value={form.image}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, image: e.target.value }))
                    }
                    className="flex-1 border border-[#CFCFCF] rounded-lg px-4 py-3 text-sm font-bold text-black outline-none focus:border-[#D87D4A]"
                    placeholder="https://... or upload below"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading}
                    className="admin-button admin-button--primary flex items-center gap-2 px-4 py-3 bg-[#F1F1F1] rounded-lg text-sm font-bold hover:bg-[#D87D4A] hover:text-white transition-colors disabled:opacity-60"
                  >
                    <MdUpload />
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {form.image && (
                  <div className="mt-3 w-20 h-20 bg-[#F1F1F1] rounded-lg overflow-hidden">
                    <img
                      src={form.image}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-black mb-2 block">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full border border-[#CFCFCF] rounded-lg px-4 py-3 text-sm font-bold text-black outline-none focus:border-[#D87D4A] resize-none"
                  placeholder="Product description..."
                />
              </div>

              {/* Features */}
              <div>
                <label className="text-xs font-bold text-black mb-2 block">
                  Features
                </label>
                <textarea
                  value={form.features}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      features: e.target.value,
                    }))
                  }
                  rows={5}
                  className="w-full border border-[#CFCFCF] rounded-lg px-4 py-3 text-sm text-black outline-none focus:border-[#D87D4A] resize-none font-medium"
                  placeholder="Detailed feature description..."
                />
              </div>

              {/* In the Box */}
              <div>
                <label className="text-xs font-bold text-black mb-2 block">
                  In The Box
                </label>
                <div className="flex flex-col gap-2">
                  {form.inTheBox.map((boxItem, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="number"
                        value={boxItem.quantity}
                        onChange={(e) =>
                          updateBoxItem(i, "quantity", e.target.value)
                        }
                        className="w-16 border border-[#CFCFCF] rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[#D87D4A]"
                        min="1"
                        placeholder="Qty"
                      />
                      <input
                        value={boxItem.item}
                        onChange={(e) =>
                          updateBoxItem(i, "item", e.target.value)
                        }
                        className="flex-1 border border-[#CFCFCF] rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-[#D87D4A]"
                        placeholder="Item name (e.g. User Manual)"
                      />
                      {i > 0 && (
                        <button
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              inTheBox: prev.inTheBox.filter(
                                (_, idx) => idx !== i,
                              ),
                            }))
                          }
                          className="admin-button admin-button--danger-soft admin-button--icon w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        inTheBox: [
                          ...prev.inTheBox,
                          { quantity: "1", item: "" },
                        ],
                      }))
                    }
                    className="admin-button admin-button--secondary text-sm text-[#D87D4A] font-bold hover:text-[#FBAF85] text-left"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* Gallery URLs */}
              <div>
                <label className="text-xs font-bold text-black mb-2 block">
                  Gallery Images (URLs)
                </label>
                {form.gallery.map((url, i) => (
                  <div key={i} className="mb-2">
                    <input
                      value={url}
                      onChange={(e) => {
                        const updated = [...form.gallery];
                        updated[i] = e.target.value;
                        setForm((prev) => ({ ...prev, gallery: updated }));
                      }}
                      className="w-full border border-[#CFCFCF] rounded-lg px-4 py-3 text-sm font-bold text-black outline-none focus:border-[#D87D4A]"
                      placeholder={`Gallery image ${i + 1} URL`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal action buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="admin-button admin-button--secondary flex-1 py-4 border-2 border-gray-200 text-black font-bold text-sm uppercase tracking-[1px] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="admin-button admin-button--primary flex-1 bg-[#D87D4A] text-white font-bold text-[13px] tracking-[1px] uppercase py-4 px-8 hover:bg-[#FBAF85] transition-colors cursor-pointer duration-200 disabled:opacity-60 py-4 disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : editingProduct
                    ? "Save Changes"
                    : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Confirmation Dialog ===== */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-100 w-full text-center animate-fadeIn">
            <p className="text-4xl mb-4">🗑️</p>
            <h3 className="font-bold text-xl text-black mb-2">
              Delete Product?
            </h3>
            <p className="text-sm text-black/50 mb-8">
              This action cannot be undone. The product will be permanently
              removed.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="admin-button admin-button--secondary flex-1 py-3 border-2 border-gray-200 font-bold text-sm uppercase rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="admin-button admin-button--danger flex-1 py-3 bg-red-500 text-white font-bold text-sm uppercase rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
