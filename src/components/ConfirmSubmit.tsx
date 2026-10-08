"use client";

export default function ConfirmSubmit({
  children, confirmText = "Are you sure?", className = "btn-outline btn-sm text-red-600 border-red-300",
}: {
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
