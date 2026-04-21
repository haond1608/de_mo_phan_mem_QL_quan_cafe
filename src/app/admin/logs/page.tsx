"use client";

import { useState, useEffect } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Nhật ký Hệ thống (Audit Logs)</h1>
        <button 
          onClick={fetchLogs}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 transition"
        >
          Làm mới
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4">Người thực hiện</th>
              <th className="px-6 py-4">Hành động</th>
              <th className="px-6 py-4">Đối tượng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="text-sm hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-gray-500 font-mono">
                  {new Date(log.timestamp).toLocaleString("vi-VN")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{log.user.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">{log.user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-tighter ${
                    log.action.includes("DELETE") ? "bg-red-100 text-red-700" :
                    log.action.includes("CREATE") ? "bg-green-100 text-green-700" :
                    log.action.includes("PAY") ? "bg-blue-100 text-blue-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 text-xs">
                    {log.target}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                  Chưa có nhật ký thao tác nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
