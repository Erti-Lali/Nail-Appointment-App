"use client";

// Catches errors thrown in the root layout itself. Must render its own
// <html>/<body> and can't rely on app styles, so it uses inline styles.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, fontFamily: "Arial, Helvetica, sans-serif", background: "#FAF3F0", color: "#2D0A1A" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 360, textAlign: "center", background: "#FFFFFF", border: "1px solid #F0DDE5", borderRadius: 16, padding: 32 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Bir şeyler ters gitti</h1>
            <p style={{ color: "#6B3050", fontSize: 14, marginTop: 8 }}>
              Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
            </p>
            {error?.digest && <p style={{ color: "#9B6E7A", fontSize: 11, marginTop: 12 }}>Hata kodu: {error.digest}</p>}
            <button
              onClick={reset}
              style={{ marginTop: 20, background: "#C4356A", color: "#FFFFFF", border: 0, fontWeight: 600, padding: "10px 20px", borderRadius: 12, cursor: "pointer" }}
            >
              Tekrar dene
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
