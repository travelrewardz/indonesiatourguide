import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl">🧭</div>
      <h1 className="font-display mt-4 text-4xl font-medium">Page not found</h1>
      <p className="mt-3 max-w-md text-gray-600">
        The island you&apos;re looking for doesn&apos;t exist — or the tour has moved. Try search, or head back home.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-primary">Back home</Link>
        <Link href="/tours" className="btn-outline">Browse tours</Link>
      </div>
    </div>
  );
}
