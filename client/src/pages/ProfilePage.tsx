// ============================================================
// pages/ProfilePage.tsx
// User settings page — logged-in users only (protected route).
// Allows users to:
// - Update their name, phone, address, and password
// - Upload a new profile avatar (via Cloudinary)
// - Logout
// ============================================================

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiCamera, FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../Services/api";
import toast from "react-hot-toast";

const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // File input ref — we click it programmatically when user clicks the avatar
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state — initialized from current user data
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);

  // Handle text field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Validate form before saving
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";

    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile changes
  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      // Build the update payload — only include fields that changed
      const updateData: Record<string, string> = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      };

      // Only include password if user entered a new one
      if (formData.password) {
        updateData.password = formData.password;
      }

      // PUT /api/auth/profile
      const { data } = await api.patch("/auth/profile", updateData);

      // Update the user in AuthContext and localStorage
      updateUser(data);

      // Clear password fields after save
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size check: 5MB max
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    // File type check
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Create FormData for multipart/form-data upload
      // Multer on the server expects the file in the "avatar" field
      const formData = new FormData();
      formData.append("avatar", file);

      // POST /api/auth/avatar
      await api.post("/auth/avatar", formData, {
        headers: {
          // Override content-type for multipart upload
          "Content-Type": "multipart/form-data",
        },
      });

      // Update the user's avatar in context
      const { data: profile } = await api.get("/auth/profile");
      updateUser({ avatar: profile.avatar });
      toast.success("Avatar updated!");
    } catch (error: any) {
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle logout
  const handleLogout = (): void => {
    logout();
    navigate("/");
  };

  // Reusable field component
  const Field = ({
    label,
    name,
    type = "text",
    placeholder,
    error,
  }: {
    label: string;
    name: keyof typeof formData;
    type?: string;
    placeholder?: string;
    error?: string;
  }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          className={`text-xs font-bold ${error ? "text-red-500" : "text-black"}`}
        >
          {label}
        </label>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full border rounded-lg px-6 py-4 text-sm font-bold text-black
          placeholder:text-black/40 outline-none focus:border-[#D87D4A] transition-colors
          ${error ? "border-red-500" : "border-[#CFCFCF]"}
        `}
      />
    </div>
  );

  if (!user) return null;

  return (
    <div className="account-page bg-[#F1F1F1] min-h-screen py-12 animate-fadeIn">
      <div className="page-padding max-w-200 mx-auto">
        <h1 className="font-bold text-[28px] md:text-[32px] tracking-[1.14px] uppercase text-black mb-8">
          Profile Settings
        </h1>

        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
          {/* ---- Avatar Section ---- */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative">
              {/* Avatar circle */}
              <div className="w-24 h-24 rounded-full bg-[#D87D4A] flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-4xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Camera icon overlay — clicking triggers the file input */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#D87D4A] flex items-center justify-center text-white shadow hover:bg-[#FBAF85] transition-colors disabled:opacity-60"
                aria-label="Change avatar"
              >
                {isUploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiCamera className="text-sm" />
                )}
              </button>

              {/* Hidden file input — triggered by the camera button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="mt-4 text-center">
              <p className="font-bold text-lg text-black">{user.name}</p>
              <p className="text-sm text-black/50">{user.email}</p>
              {user.isAdmin && (
                <span className="inline-block mt-2 px-3 py-1 bg-[#D87D4A] text-white text-xs font-bold rounded-full uppercase tracking-wide">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* ---- Personal Info Section ---- */}
          <section>
            <h2 className="text-xs font-bold tracking-[0.93px] text-[#D87D4A] uppercase mb-6">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Full Name"
                name="name"
                placeholder="Your full name"
                error={errors.name}
              />
              {/* Email — read-only, shown but not editable */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-black">
                  Email Address
                </label>
                <div className="w-full border border-[#CFCFCF] rounded-lg px-6 py-4 text-sm font-bold text-black/40 bg-gray-50">
                  {user.email}
                </div>
              </div>
              <Field
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+1 202-555-0136"
              />
              <Field
                label="Default Address"
                name="address"
                placeholder="1137 Williams Avenue"
              />
            </div>
          </section>

          {/* ---- Change Password Section ---- */}
          <section className="mt-10">
            <h2 className="text-xs font-bold tracking-[0.93px] text-[#D87D4A] uppercase mb-6">
              Change Password
            </h2>
            <p className="text-sm text-black/50 mb-6">
              Leave blank if you don't want to change your password.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="New Password"
                name="password"
                type="password"
                placeholder="Min 8 characters"
                error={errors.password}
              />
              <Field
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="Repeat new password"
                error={errors.confirmPassword}
              />
            </div>
          </section>

          {/* ---- Action Buttons ---- */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex-1 text-center py-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 flex-1 py-4 border-2 border-red-500 text-red-500 font-bold text-[13px] uppercase tracking-[1px] hover:bg-red-500 hover:text-white transition-colors"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
