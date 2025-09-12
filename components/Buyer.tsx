import React from 'react'

const Buyer = () => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-xl">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Buyer Activities</h2>
          <p className="text-sm text-gray-500">Browse products, manage orders, and track purchases</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Recent Orders</h3>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">No orders yet</div>
              <button className="text-blue-600 text-sm hover:underline">Browse Products →</button>
            </div>
          </div>

          {/* Wishlist */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Wishlist</h3>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">No items in wishlist</div>
              <button className="text-blue-600 text-sm hover:underline">Add Items →</button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                Browse Categories
              </button>
              <button className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-200 transition-colors">
                Track Orders
              </button>
              <button className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm hover:bg-purple-200 transition-colors">
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Buyer