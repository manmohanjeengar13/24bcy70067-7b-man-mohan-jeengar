'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/layout/Navbar';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import ProductForm from '../../components/products/ProductForm';
import { useAuthStore } from '../../store/authStore';
import { useProductStore } from '../../store/productStore';
import { UserPublic, Product, Role } from '../../types';
import { formatPrice, formatDate, ROLE_COLORS, ROLE_DOTS, CATEGORY_ICONS } from '../../lib/utils';
import api from '../../lib/axios';

type Tab = 'overview' | 'products' | 'users';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { products, fetchProducts, updateProduct, removeProduct } = useProductStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/users');
      setUsers((res.data.data as { users: UserPublic[] }).users);
    } catch {
      /* no-op */
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'admin') {
      fetchUsers();
    }
  }, [activeTab, user, fetchUsers]);

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      await api.patch(`/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch {
      alert('Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Delete user "${name}"?`)) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      alert('Failed to delete user.');
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${productId}`);
      removeProduct(productId);
    } catch {
      alert('Failed to delete product.');
    }
  };

  // Stats
  const categoryStats = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const avgPrice = products.length
    ? products.reduce((sum, p) => sum + Number(p.price), 0) / products.length
    : 0;

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'products', label: 'Products', show: true },
    { id: 'users', label: 'Users', show: user?.role === 'admin' },
  ];

  return (
    <ProtectedRoute minRole="manager">
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-0.5 text-sm text-gray-500">Manage your platform</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit shadow-sm">
            {tabs.filter((t) => t.show).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Stat cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Total Products', value: products.length, icon: '📦', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: 'Total Stock', value: totalStock.toLocaleString(), icon: '🏭', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { label: 'Avg. Price', value: formatPrice(avgPrice), icon: '💰', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { label: 'Total Users', value: users.length || '—', icon: '👥', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-2xl border p-5 ${stat.color}`}
                  >
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm font-medium opacity-75 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Products by category */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-gray-900">Products by category</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(categoryStats).map(([cat, count]) => (
                    <div key={cat} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                      <div className="text-2xl mb-1">{CATEGORY_ICONS[cat]}</div>
                      <div className="text-xl font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500 capitalize mt-0.5">{cat}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Products tab */}
          {activeTab === 'products' && (
            <div className="animate-fade-in">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">All Products</h2>
                <button
                  onClick={() => setShowCreate(true)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  + Add product
                </button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      {['Name', 'Category', 'Price', 'Stock', 'Created', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-3 capitalize text-gray-600">
                          {CATEGORY_ICONS[p.category]} {p.category}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatPrice(p.price)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.stock === 0
                                ? 'bg-red-100 text-red-700'
                                : p.stock < 10
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(p.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditProduct(p)}
                              className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                            >
                              Edit
                            </button>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">No products yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Users tab — admin only */}
          {activeTab === 'users' && user?.role === 'admin' && (
            <div className="animate-fade-in">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900">User Management</h2>
              </div>
              {loadingUsers ? (
                <div className="flex justify-center py-12">
                  <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr>
                        {['Name', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {u.name}
                            {u.id === user.id && (
                              <span className="ml-2 text-xs text-gray-400">(you)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{u.email}</td>
                          <td className="px-4 py-3">
                            {u.id === user.id ? (
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                                {ROLE_DOTS[u.role]} {u.role}
                              </span>
                            ) : (
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer ${ROLE_COLORS[u.role]}`}
                              >
                                <option value="user">🟢 user</option>
                                <option value="manager">🟡 manager</option>
                                <option value="admin">🔴 admin</option>
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                          <td className="px-4 py-3">
                            {u.id !== user.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="py-12 text-center text-gray-400 text-sm">No users found.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Edit product modal */}
        {editProduct && (
          <ProductForm
            product={editProduct}
            onClose={() => setEditProduct(null)}
            onSave={(updated) => {
              updateProduct(updated);
              setEditProduct(null);
            }}
          />
        )}

        {/* Create product modal */}
        {showCreate && (
          <ProductForm
            onClose={() => setShowCreate(false)}
            onSave={(product) => {
              fetchProducts();
              setShowCreate(false);
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
