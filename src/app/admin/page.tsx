export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      <p className="mt-4 text-gray-600">
        Welcome to the cafe management system. Use the sidebar to manage menu,
        orders, and logs.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow text-black">
          <p className="text-sm font-medium text-gray-500">Today's Orders</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow text-black">
          <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">0đ</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow text-black">
          <p className="text-sm font-medium text-gray-500">Active Products</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow text-black">
          <p className="text-sm font-medium text-gray-500">Staff Active</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">1</p>
        </div>
      </div>
    </div>
  );
}
