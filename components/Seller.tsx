import React from 'react'

const Seller = () => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-xl">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Seller Management</h2>
          <p className="text-sm text-gray-500">Manage inventory, process orders, and track sales</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inventory Status */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Inventory Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Products:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Out of Stock:</span>
                <span className="font-medium text-red-600">0</span>
              </div>
              <button className="text-green-600 text-sm hover:underline">Add Products →</button>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Recent Sales</h3>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">No sales yet</div>
              <button className="text-green-600 text-sm hover:underline">View Analytics →</button>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Pending Orders</h3>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">No pending orders</div>
              <button className="text-green-600 text-sm hover:underline">Manage Orders →</button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-200 transition-colors">
                Add New Product
              </button>
              <button className="w-full bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                Update Inventory
              </button>
              <button className="w-full bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-sm hover:bg-orange-200 transition-colors">
                View Reports
              </button>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Performance This Month</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$0</div>
              <div className="text-xs text-gray-500">Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-xs text-gray-500">Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-xs text-gray-500">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">0%</div>
              <div className="text-xs text-gray-500">Growth</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Seller