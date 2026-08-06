import "./globals.css";

export const metadata = {
  title: "J-Global Game Arcade",
  description: "Practice Japanese through games",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-100">
        {children}
      </body>
    </html>
  );
}
