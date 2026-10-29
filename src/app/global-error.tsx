"use client";

// Shown only if the root layout itself fails. Kept dependency-free on purpose.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#F7F4EE", color: "#24221F", fontFamily: "Georgia, serif", padding: "15vh 20px", textAlign: "center" }}>
        <h1 style={{ fontStyle: "italic", fontWeight: 400, fontSize: "2rem" }}>Something interrupted the page.</h1>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", color: "#6E685F" }}>Please try again in a moment.</p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: 24, minHeight: 44, padding: "0 20px", background: "#A64B35", color: "#FFFEFA", border: 0, borderRadius: 2, cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
