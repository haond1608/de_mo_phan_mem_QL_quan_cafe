"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function POSPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [toppings, setToppings] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedToppings, setSelectedToppings] = useState<any[]>([]);
  const [itemNote, setItemNote] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);

  // Success state
  const [lastOrder, setLastOrder] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/pos/menu").then((res) => res.json()),
      fetch("/api/auth/session")
        .then((res) => res.json())
        .catch(() => ({ user: null })),
    ]).then(([menuData, sessionData]) => {
      setCategories(menuData.categories);
      setProducts(menuData.products);
      setToppings(menuData.toppings || []);
      setUser(sessionData.user);
      setLoading(false);
    });
  }, []);

  const openItemModal = (product: any) => {
    setCurrentProduct(product);
    setSelectedSize(product.sizes[0] || null);
    setSelectedToppings([]);
    setItemNote("");
    setItemQuantity(1);
    setShowItemModal(true);
  };

  const addToCart = () => {
    if (!selectedSize) {
      alert("Vui lòng chọn size!");
      return;
    }

    const toppingPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    const unitPrice = selectedSize.price + toppingPrice;

    setCart([
      ...cart,
      {
        productId: currentProduct.id,
        name: currentProduct.name,
        sizeId: selectedSize.id,
        sizeName: selectedSize.name,
        toppings: selectedToppings,
        price: unitPrice,
        quantity: itemQuantity,
        note: itemNote,
      },
    ]);
    setShowItemModal(false);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const checkout = async (paymentMethod: string = "CASH") => {
    if (cart.length === 0) return;

    try {
      const res = await fetch("/api/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          totalPrice: total,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        // Pay the order
        await fetch(`/api/pos/orders/${order.id}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod }),
        });

        setLastOrder(order);
        setCart([]);

        // Auto send ticket
        await fetch(`/api/pos/orders/${order.id}/ticket`, { method: "POST" });

        alert("Thanh toán thành công & Đã gửi ticket pha chế!");
      } else {
        const error = await res.json();
        alert(error.error || "Lỗi khi tạo đơn hàng");
      }
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      router.push("/login");
    }
  };

  const printInvoice = async () => {
    if (!lastOrder) return;
    window.open(`/api/pos/orders/${lastOrder.id}/invoice`, "_blank");
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryIDs?.includes(selectedCategory))
    : products;

  if (loading)
    return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans text-gray-900">
      {/* Product List */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
              selectedCategory === null
                ? "bg-orange-600 text-white shadow-md"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
                selectedCategory === cat.id
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-white text-black hover:bg-gray-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pr-2">
          {filteredProducts.map((prod) => (
            <button
              key={prod.id}
              onClick={() => openItemModal(prod)}
              className="flex h-[260px] flex-col rounded-xl bg-white p-3 text-left shadow-sm transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-black"
            >
              <div className="aspect-video w-full rounded-lg bg-orange-50 mb-3 flex items-center justify-center text-orange-200 overflow-hidden">
                {prod.image ? (
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <svg
                    className="w-12 h-12"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M2 21h18v-2H2v2zM20 8h-2V5h2v3zm2-3h-4V2h4v3zm0 11h-4v-1h4v1zm-6-7V2l-4 4l4 4V7c3.31 0 6 2.69 6 6s-2.69 6-6 6s-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8s-3.58-8-8-8z" />
                  </svg>
                )}
              </div>
              <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight flex-1">
                {prod.name}
              </h3>
              <p className="mt-2 text-lg text-orange-600 font-black">
                {prod.basePrice.toLocaleString()}đ
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart / Sidebar */}
      <div className="w-[400px] bg-white shadow-2xl flex flex-col text-black">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-gray-900 leading-tight">
              Đơn hàng
            </h2>
          </div>
          <div className="flex gap-2">
            {lastOrder && (
              <button
                onClick={printInvoice}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                title="In hóa đơn vừa thanh toán"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300 transition"
              title="Đăng nhập lại"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Login
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white text-black">
          {cart.map((item, index) => (
            <div
              key={index}
              className="group relative flex justify-between items-start p-3 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition"
            >
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">{item.name}</h4>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 rounded uppercase">
                    Size {item.sizeName}
                  </span>
                  {item.toppings.map((t: any) => (
                    <span
                      key={t.id}
                      className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded"
                    >
                      +{t.name}
                    </span>
                  ))}
                </div>
                {item.note && (
                  <p className="text-xs italic text-gray-500 mt-1">
                    "{item.note}"
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-bold">{item.quantity}</span> x{" "}
                  {item.price.toLocaleString()}đ
                </p>
              </div>
              <div className="flex flex-col items-end justify-between h-full">
                <button
                  onClick={() => removeFromCart(index)}
                  className="text-gray-300 hover:text-red-500 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <span className="font-black text-gray-900">
                  {(item.price * item.quantity).toLocaleString()}đ
                </span>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
              <svg
                className="w-24 h-24 mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2s-.9-2-2-2zM1 2v2h2l3.6 7.59l-1.35 2.45c-.16.28-.25.61-.25.96c0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48c0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2s2-.9 2-2s-.9-2-2-2z" />
              </svg>
              <p className="text-xl font-bold">Trống</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 shadow-inner">
          <div className="flex justify-between text-2xl font-black mb-6">
            <span>Tổng cộng</span>
            <span className="text-orange-600">{total.toLocaleString()}đ</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => checkout("CASH")}
              disabled={cart.length === 0}
              className="flex flex-col items-center justify-center rounded-xl bg-green-600 py-4 text-white font-bold hover:bg-green-700 disabled:opacity-50 transition"
            >
              <span className="text-sm opacity-80 uppercase tracking-wider mb-1">
                Tiền mặt
              </span>
              <span className="text-xl font-black">THANH TOÁN</span>
            </button>
            <button
              onClick={() => checkout("TRANSFER")}
              disabled={cart.length === 0}
              className="flex flex-col items-center justify-center rounded-xl bg-blue-600 py-4 text-white font-bold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <span className="text-sm opacity-80 uppercase tracking-wider mb-1">
                Chuyển khoản
              </span>
              <span className="text-xl font-black">THANH TOÁN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Item Selection Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-black">
            <div className="p-6 border-b flex justify-between items-center bg-orange-50">
              <h2 className="text-2xl font-black text-gray-900">
                {currentProduct.name}
              </h2>
              <button
                onClick={() => setShowItemModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Size Selection */}
              <div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
                  Chọn Size (Bắt buộc)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {currentProduct.sizes.map((size: any) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                        selectedSize?.id === size.id
                          ? "border-orange-600 bg-orange-50 text-orange-600"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <span className="text-xl font-black">{size.name}</span>
                      <span className="text-sm font-medium opacity-80">
                        {size.price.toLocaleString()}đ
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topping Selection */}
              <div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
                  Thêm Topping
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {toppings.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (selectedToppings.find((st) => st.id === t.id)) {
                          setSelectedToppings(
                            selectedToppings.filter((st) => st.id !== t.id),
                          );
                        } else {
                          setSelectedToppings([...selectedToppings, t]);
                        }
                      }}
                      className={`flex justify-between items-center p-3 rounded-xl border-2 transition ${
                        selectedToppings.find((st) => st.id === t.id)
                          ? "border-orange-600 bg-orange-50 text-orange-600"
                          : "border-gray-50 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <span className="font-bold">{t.name}</span>
                      <span className="text-xs font-bold">
                        +{t.price.toLocaleString()}đ
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
                  Ghi chú món
                </h3>
                <textarea
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="VD: Ít đá, nhiều đường..."
                  className="w-full rounded-xl border-2 border-gray-100 p-4 focus:border-orange-600 focus:outline-none transition h-24 resize-none"
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between pt-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                  Số lượng
                </h3>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() =>
                      setItemQuantity(Math.max(1, itemQuantity - 1))
                    }
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-black hover:bg-gray-200 transition"
                  >
                    -
                  </button>
                  <span className="text-3xl font-black w-8 text-center">
                    {itemQuantity}
                  </span>
                  <button
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center text-2xl font-black hover:bg-orange-700 transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={addToCart}
                className="w-full rounded-xl bg-orange-600 py-4 text-white font-black text-xl shadow-lg shadow-orange-200 hover:bg-orange-700 transition"
              >
                Thêm vào đơn -{" "}
                {(
                  (selectedSize?.price || 0) +
                  selectedToppings.reduce((s, t) => s + t.price, 0) *
                    itemQuantity
                ).toLocaleString()}
                đ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
