"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function InvoicePage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pos/orders/${id}/invoice`)
      .then((res) => res.json())
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return <div className="p-8 text-center">Đang tải hóa đơn...</div>;
  if (invoice?.error)
    return <div className="p-8 text-center text-red-600">{invoice.error}</div>;

  return (
    <div className="mx-auto max-w-[400px] bg-white p-6 shadow-lg font-mono text-sm leading-relaxed">
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-xl font-bold uppercase tracking-widest">
          CAFE MANAGEMENT
        </h1>
        <p>123 Đường ABC, Quận XYZ, TP.HCM</p>
        <p>SĐT: 0123.456.789</p>
      </div>

      <div className="border-t border-b border-dashed py-3 mb-4 space-y-1">
        <div className="flex justify-between">
          <span>Số HD:</span>
          <span className="font-bold">{invoice.code}</span>
        </div>
        <div className="flex justify-between">
          <span>Ngày:</span>
          <span>{new Date(invoice.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>NV:</span>
          <span>{invoice.staff}</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex font-bold border-b border-dashed pb-1">
          <span className="flex-1">Tên món</span>
          <span className="w-8 text-center">SL</span>
          <span className="w-20 text-right">T.Tiền</span>
        </div>
        {invoice.items.map((item: any, idx: number) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex">
              <span className="flex-1 font-bold">{item.name}</span>
              <span className="w-8 text-center">{item.quantity}</span>
              <span className="w-20 text-right">
                {item.total.toLocaleString()}
              </span>
            </div>
            <div className="flex text-[10px] pl-2 text-gray-600">
              <span>Size: {item.size}</span>
              {item.note && <span className="ml-2 italic"> - {item.note}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed pt-3 space-y-2">
        <div className="flex justify-between text-lg font-bold">
          <span>TỔNG CỘNG:</span>
          <span>{invoice.totalPrice.toLocaleString()}đ</span>
        </div>
        <div className="flex justify-between italic opacity-80">
          <span>Hình thức:</span>
          <span>
            {invoice.paymentMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản"}
          </span>
        </div>
      </div>

      <div className="mt-10 text-center space-y-1 text-[11px] opacity-70">
        <p>Cảm ơn quý khách!</p>
        <p>Hẹn gặp lại!</p>
        <div className="pt-4 flex justify-center">
          <svg
            className="w-16 h-16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2m-10 0H5a2 2 0 01-2-2v-2M7 12h10M12 7v10" />
          </svg>
        </div>
      </div>

      <div className="mt-8 print:hidden flex justify-center">
        <button
          onClick={() => window.print()}
          className="rounded bg-orange-600 px-6 py-2 text-white font-bold hover:bg-orange-700 shadow-md"
        >
          IN HÓA ĐƠN
        </button>
      </div>
    </div>
  );
}
