import Link from 'next/link';
import { siteConfig } from '@/config/site.config';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="relative max-w-lg w-full overflow-hidden">
        <div className="relative p-10 flex flex-col items-center text-center gap-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.25em] bg-white/70 text-gray-600">
            Not found
          </span>
          <h1
            className="text-6xl sm:text-7xl font-bold"
            style={{ color: 'var(--primary-color, #000000)' }}
          >
            404
          </h1>
          <p className="text-lg font-semibold text-gray-900">This page is missing.</p>
          <p className="text-gray-600 max-w-md">
            The link might be outdated or the page moved. Let’s get you back to where the collection lives.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-3 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: 'var(--primary-color, #000000)' }}
            >
              Go home
            </Link>
            <Link
              href="/products"
              className="w-full sm:w-auto px-5 py-3 rounded-full text-sm font-semibold text-gray-900 bg-white/80 hover:bg-white"
            >
              Browse products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
