"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log to your error-reporting service here.
    console.error(error);
  }, [error]);

  return (
    <div className="container-x py-20">
      <div className="card max-w-md mx-auto p-10 text-center animate-fade-up">
        <p className="text-6xl mb-4">🧸</p>
        <h1 className="font-display text-2xl font-bold text-ink">
          Something went wrong
        </h1>
        <p className="text-gray-500 mt-2 mb-6">
          A gremlin got into the toy box. Try again, or head back home.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()} className="btn-primary">Try again</button>
          <Link href="/" className="btn-ghost">Back to shop</Link>
        </div>
      </div>
    </div>
  );
}
