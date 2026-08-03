import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found (404) | Homy Organic',
  description: 'The requested page could not be found on Homy Organic Store.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="relative max-w-lg w-full overflow-hidden">
        <div className="relative p-10 flex flex-col items-center text-center gap-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.25em] bg-gray-100 text-gray-600">
            Page Not Found
          </span>
          <h1
            className="text-6xl sm:text-7xl font-bold"
            style={{ color: 'var(--primary-color, #000000)' }}
          >
            404
          </h1>
          <p className="text-lg font-semibold text-gray-900">This page is missing.</p>
          <p className="text-gray-600 max-w-md text-sm leading-relaxed">
            The link might be outdated or the page moved. Let’s get you back to our featured organic collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto mt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--primary-color, #000000)' }}
            >
              Go to Home Page
            </Link>
            <Link
              href="/products"
              className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
