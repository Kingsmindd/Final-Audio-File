// ============================================================
// pages/admin/AdminUsers.tsx
// Manage all registered users.
// Admins can:
// - View all users with their details
// - Toggle admin status (promote/demote)
// - Delete users
// ============================================================

import React, { useState, useEffect } from "react";
import { MdDelete, MdAdminPanelSettings, MdPerson } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import api from "../../Services/api";
import toast from "react-hot-toast";

// Type for a user returned from the admin API
interface AdminUser {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth(); // The logged-in admin
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (): Promise<void> => {
    try {
      // GET /api/admin/users
      const { data } = await api.get<AdminUser[]>("/admin/users");
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Toggle admin status for a user
  const handleToggleAdmin = async (
    userId: string,
    currentIsAdmin: boolean,
  ): Promise<void> => {
    // Prevent demoting yourself
    if (userId === currentUser?._id && currentIsAdmin) {
      toast.error("You cannot demote yourself from admin!");
      return;
    }

    try {
      // PUT /api/admin/users/:id
      await api.patch(`/admin/users/${userId}`, {
        isAdmin: !currentIsAdmin,
      });

      // Update local state optimistically
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isAdmin: !currentIsAdmin } : u,
        ),
      );

      toast.success(
        currentIsAdmin
          ? "Admin privileges removed"
          : "Admin privileges granted",
      );
    } catch {
      toast.error("Failed to update user role");
    }
  };

  // Delete a user
  const handleDelete = async (userId: string): Promise<void> => {
    try {
      // DELETE /api/admin/users/:id
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setDeleteConfirm(null);
      toast.success("User deleted");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const totalAdmins = users.filter((u) => u.isAdmin).length;

  return (
    <div className="p-6 md:p-8 lg:p-10 animate-[fadeIn_0.4s_ease-in]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-2xl md:text-3xl text-black">Users</h1>
          <p className="text-sm text-black/40 mt-1">
            {users.length} total · {totalAdmins} admin
            {totalAdmins !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {["User", "Email", "Phone", "Role", "Joined", "Actions"].map(
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
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-black/40"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar + Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#D87D4A] flex items-center justify-center overflow-hidden shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-black">
                            {user.name}
                          </p>
                          {user._id === currentUser?._id && (
                            <p className="text-xs text-[#D87D4A]">You</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-black max-w-45 truncate">
                      {user.email}
                    </td>

                    <td className="px-6 py-4 text-sm text-black/60">
                      {user.phone || "—"}
                    </td>

                    {/* Role badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          user.isAdmin
                            ? "bg-[#D87D4A]/10 text-[#D87D4A]"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {user.isAdmin ? (
                          <>
                            <MdAdminPanelSettings className="text-sm" />
                            Admin
                          </>
                        ) : (
                          <>
                            <MdPerson className="text-sm" />
                            User
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-black/50">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Toggle admin — disabled for self to prevent lockout */}
                        <button
                          onClick={() =>
                            handleToggleAdmin(user._id, user.isAdmin)
                          }
                          disabled={
                            user._id === currentUser?._id && user.isAdmin
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            user.isAdmin
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-[#D87D4A]/10 text-[#D87D4A] hover:bg-[#D87D4A] hover:text-white"
                          }`}
                          title={user.isAdmin ? "Remove admin" : "Make admin"}
                        >
                          {user.isAdmin ? "Remove Admin" : "Make Admin"}
                        </button>

                        {/* Delete — disabled for self */}
                        <button
                          onClick={() => setDeleteConfirm(user._id)}
                          disabled={user._id === currentUser?._id}
                          className="admin-button admin-button--danger-soft admin-button--icon w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Delete user"
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

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-100 w-full text-center animate-[fadeIn_0.4s_ease-in]">
            <p className="text-4xl mb-4">⚠️</p>
            <h3 className="font-bold text-xl text-black mb-2">Delete User?</h3>
            <p className="text-sm text-black/50 mb-8">
              This will permanently delete the user's account and cannot be
              undone.
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

export default AdminUsers;
