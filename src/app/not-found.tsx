import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-20">
      <div className="text-center">
        <div className="text-7xl font-black text-brand-200">404</div>
        <h1 className="mt-4 text-3xl font-black">Page not found</h1>
        <p className="mx-auto mt-2 max-w-md text-gray-600">
          The page you are looking for has drifted off the archipelago.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-primary">Back home</Link>
          <Link href="/tours" className="btn-outline">Browse tours</Link>
        </div>
      </div>
    </div>
  );
}
