import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl">🚪</div>
      <h1 className="font-display mt-4 text-4xl font-medium">Access denied</h1>
      <p className="mt-3 max-w-md text-gray-600">
        Your account doesn&apos;t have permission for this area. If you believe this is a mistake, contact support.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-primary">Back home</Link>
        <Link href="/account" className="btn-outline">My account</Link>
      </div>
    </div>
  );
}
