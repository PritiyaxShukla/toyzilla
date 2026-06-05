import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="container-x py-20">
      <div className="card max-w-md mx-auto p-10 text-center animate-fade-up">
        <p className="text-6xl mb-4">🦖</p>
        <h1 className="font-display text-3xl font-bold text-ink">404</h1>
        <p className="text-gray-500 mt-2 mb-6">
          Oops! This page wandered off to the toy box. Let&apos;s get you back.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary">Back to shop</Link>
          <Link href="/faq" className="btn-ghost">Get help</Link>
        </div>
      </div>
    </div>
  );
}
