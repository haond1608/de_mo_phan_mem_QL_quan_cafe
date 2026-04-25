"use client";

import { useState, useEffect } from "react";

export default function MenuManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [toppings, setToppings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalType, setModalType] = useState<
    "product" | "category" | "topping" | null
  >(null);
  const [editItem, setEditItem] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState<any>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [catRes, prodRes, topRes] = await Promise.all([
      fetch("/api/admin/categories"),
      fetch("/api/admin/products"),
      fetch("/api/admin/toppings"),
    ]);
    setCategories(await catRes.json());
    setProducts(await prodRes.json());
    setToppings(await topRes.json());
    setLoading(false);
  };

  const handleOpenModal = (
    type: "product" | "category" | "topping",
    item: any = null,
  ) => {
    setModalType(type);
    setEditItem(item);
    if (item) {
      if (type === "product") {
        setFormData({
          name: item.name,
          description: item.description || "",
          image: item.image || "",
          basePrice: item.basePrice,
          categoryId: item.categoryIDs?.[0] || "",
          status: item.status,
          sizes: item.sizes || [],
        });
      } else {
        setFormData({ ...item });
      }
    } else {
      if (type === "product") {
        setFormData({
          name: "",
          description: "",
          image: "",
          basePrice: 0,
          categoryId: categories[0]?.id || "",
          status: "AVAILABLE",
          sizes: [{ name: "M", price: 0 }],
        });
      } else if (type === "category") {
        setFormData({ name: "" });
      } else {
        setFormData({ name: "", price: 0 });
      }
    }
    setImageFile(null);
  };

  const handleCloseModal = () => {
    setModalType(null);
    setEditItem(null);
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = formData.image || "";

    // Upload image if selected
    if (imageFile) {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append("file", imageFile);

      try {
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formDataUpload,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        } else {
          alert("Lỗi upload file");
          setUploading(false);
          return;
        }
      } catch (err) {
        alert("Lỗi kết nối khi upload");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const url = `/api/admin/${modalType === "category" ? "categories" : modalType + "s"}`;
    const method = editItem ? "PUT" : "POST";
    const body = editItem
      ? { ...formData, id: editItem.id, image: imageUrl }
      : { ...formData, image: imageUrl };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchData();
        handleCloseModal();
      } else {
        const error = await res.json();
        alert(error.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa?")) return;
    const url = `/api/admin/${type === "category" ? "categories" : type + "s"}?id=${id}`;

    try {
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Không thể xóa");
      }
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="space-y-8 pb-20">
      <h1 className="text-3xl font-bold text-gray-800">Quản lý Menu</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Categories Section */}
        <section className="rounded-lg bg-white p-6 shadow text-black">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Danh mục</h2>
            <button
              onClick={() => handleOpenModal("category")}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Thêm mới
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm font-medium text-gray-500">
                <th className="py-2">Tên</th>
                <th className="py-2">Sản phẩm</th>
                <th className="py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b text-sm">
                  <td className="py-2">{cat.name}</td>
                  <td className="py-2">{cat._count?.products || 0}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleOpenModal("category", cat)}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete("category", cat.id)}
                      className="text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Toppings Section */}
        <section className="rounded-lg bg-white p-6 shadow text-black">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Toppings</h2>
            <button
              onClick={() => handleOpenModal("topping")}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Thêm mới
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm font-medium text-gray-500">
                <th className="py-2">Tên</th>
                <th className="py-2">Giá</th>
                <th className="py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {toppings.map((top) => (
                <tr key={top.id} className="border-b text-sm">
                  <td className="py-2 font-medium">{top.name}</td>
                  <td className="py-2">{top.price.toLocaleString()}đ</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleOpenModal("topping", top)}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete("topping", top.id)}
                      className="text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Products Section */}
        <section className="rounded-lg bg-white p-6 shadow lg:col-span-2 text-black">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Sản phẩm</h2>
            <button
              onClick={() => handleOpenModal("product")}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Thêm mới
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm font-medium text-gray-500">
                <th className="py-2">Tên món</th>
                <th className="py-2">Danh mục</th>
                <th className="py-2">Giá cơ bản</th>
                <th className="py-2">Trạng thái</th>
                <th className="py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id} className="border-b text-sm">
                  <td className="py-2 font-medium">{prod.name}</td>
                  <td className="py-2 text-gray-500">
                    {prod.categories?.map((c: any) => c.name).join(", ")}
                  </td>
                  <td className="py-2 font-bold text-orange-600">
                    {prod.basePrice.toLocaleString()}đ
                  </td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        prod.status === "AVAILABLE"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {prod.status === "AVAILABLE" ? "Đang bán" : "Ngừng bán"}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleOpenModal("product", prod)}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete("product", prod.id)}
                      className="text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* Modal Overlay */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl text-black">
            <h2 className="mb-4 text-xl font-bold text-black">
              {editItem ? "Chỉnh sửa" : "Thêm mới"}{" "}
              {modalType === "product"
                ? "Sản phẩm"
                : modalType === "category"
                  ? "Danh mục"
                  : "Topping"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tên
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none text-black"
                />
              </div>

              {modalType === "product" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hình ảnh (jpg, png, gif, pdf, doc, docx)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] || null)
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none text-black"
                    />
                    {formData.image && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Ảnh hiện tại:</p>
                        {formData.image.endsWith(".pdf") ||
                        formData.image.includes("application") ? (
                          <a
                            href={formData.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Xem file hiện tại
                          </a>
                        ) : (
                          <img
                            src={formData.image}
                            alt="Current"
                            className="mt-1 h-20 w-20 object-cover rounded"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mô tả
                    </label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Giá cơ bản
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.basePrice || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          basePrice: parseFloat(e.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Danh mục
                    </label>
                    <select
                      value={formData.categoryId || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, categoryId: e.target.value })
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none text-black"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Trạng thái
                    </label>
                    <select
                      value={formData.status || "AVAILABLE"}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none text-black"
                    >
                      <option value="AVAILABLE">Đang bán</option>
                      <option value="UNAVAILABLE">Ngừng bán</option>
                    </select>
                  </div>
                </>
              )}

              {(modalType === "topping" || modalType === "product") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Giá {modalType === "topping" ? "" : "(Size M)"}
                    </label>
                    <input
                      type="number"
                      required
                      value={
                        modalType === "topping"
                          ? formData.price || 0
                          : formData.sizes?.[0]?.price || 0
                      }
                      onChange={(e) => {
                        if (modalType === "topping") {
                          setFormData({
                            ...formData,
                            price: parseFloat(e.target.value),
                          });
                        } else {
                          const newSizes = [
                            ...(formData.sizes || [{ name: "M", price: 0 }]),
                          ];
                          newSizes[0] = {
                            ...newSizes[0],
                            price: parseFloat(e.target.value),
                          };
                          setFormData({ ...formData, sizes: newSizes });
                        }
                      }}
                      className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? "Đang upload..." : editItem ? "Cập nhật" : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
