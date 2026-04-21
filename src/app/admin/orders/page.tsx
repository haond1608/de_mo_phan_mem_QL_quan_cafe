"use client";

import { useState, useEffect } from "react";

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Đang tải lịch sử đơn hàng...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Lịch sử Đơn hàng</h1>
        <button
          onClick={fetchOrders}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 transition"
        >
          Làm mới
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 text-black">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Mã đơn</th>
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4">Nhân viên</th>
              <th className="px-6 py-4">Số món</th>
              <th className="px-6 py-4">Tổng tiền</th>
              <th className="px-6 py-4">Thanh toán</th>
              <th className="px-6 py-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="text-sm hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4 font-mono font-bold text-blue-600">
                  {order.code}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(order.createdAt).toLocaleString("vi-VN")}
                </td>
                <td className="px-6 py-4 font-medium">{order.staffName}</td>
                <td className="px-6 py-4">{order.itemCount}</td>
                <td className="px-6 py-4 font-bold">
                  {order.totalPrice.toLocaleString()}đ
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      order.paymentMethod === "CASH"
                        ? "bg-green-50 text-green-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {order.paymentMethod === "CASH"
                      ? "Tiền mặt"
                      : "Chuyển khoản"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${
                      order.status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {order.status === "PAID"
                      ? "Đã thanh toán"
                      : "Chưa thanh toán"}
                  </span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-gray-400 italic"
                >
                  Chưa có đơn hàng nào được ghi nhận.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
