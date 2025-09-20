import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import ThemeToggle from "./components/ThemeToggle";
import SignInButton from "./components/SignInButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sahay (सहाय)",
  description: "AI-powered mental wellness co-pilot for students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="icon" href="/icon-192x192.png" />
        <script dangerouslySetInnerHTML={{
          __html: `if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/service-worker.js');
            });
          }`
        }} />
      </head>
  <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 min-h-screen relative dark:bg-gray-900 dark:text-gray-100 transition-colors duration-500`}> 
        {/* Animated Satisfying Background (bubbles, gradient, subtle movement) */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 w-full h-full animate-gradient bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 opacity-90" />
          {/* Animated bubbles */}
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full opacity-30 blur-2xl pointer-events-none animate-bubble${i % 3}`}
              style={{
                width: `${60 + Math.random() * 80}px`,
                height: `${60 + Math.random() * 80}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `radial-gradient(circle at 60% 40%, #a5b4fc 60%, #f0abfc 100%)`,
                animationDelay: `${i * 1.2}s`,
              }}
            />
          ))}
        </div>
        {/* Modern Header */}
        <header className="fixed top-0 left-0 w-full z-20 flex items-center justify-between h-16 bg-white/60 dark:bg-gray-900/80 backdrop-blur-md shadow-md border-b border-indigo-100 dark:border-gray-700 px-6">
          <span className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-200 tracking-tight drop-shadow-lg select-none">Sahay</span>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg">
              🏠 Home
            </Link>
            <ThemeToggle />
            <SignInButton />
          </div>
        </header>
        {/* Main Content with padding for header/footer */}
  <div className="pt-20 pb-20 min-h-screen flex flex-col items-center justify-center transition-colors duration-500">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
        {/* Glassmorphic Bottom Nav */}
        <nav className="fixed bottom-0 left-0 w-full z-20 flex justify-around items-center h-20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-t border-t border-indigo-100 dark:border-gray-700">
          <a href="/mitra" className="nav-btn flex flex-col items-center gap-1 text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200 transition">
            <span className="text-2xl">💬</span>
            <span className="text-xs font-semibold">Mitra</span>
          </a>
          <a href="/manthan" className="nav-btn flex flex-col items-center gap-1 text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200 transition">
            <span className="text-2xl">📓</span>
            <span className="text-xs font-semibold">Journal</span>
          </a>
          <a href="/dhwani" className="nav-btn flex flex-col items-center gap-1 text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200 transition">
            <span className="text-2xl">🎵</span>
            <span className="text-xs font-semibold">Dhwani</span>
          </a>
          <a href="/practice-space" className="nav-btn flex flex-col items-center gap-1 text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200 transition">
            <span className="text-2xl">🗣️</span>
            <span className="text-xs font-semibold">Practice</span>
          </a>
          <a href="/first-aid-kit" className="nav-btn flex flex-col items-center gap-1 text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200 transition">
            <span className="text-2xl">🧰</span>
            <span className="text-xs font-semibold">First Aid</span>
          </a>
          <a href="/ar-grounding" className="nav-btn flex flex-col items-center gap-1 text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200 transition">
            <span className="text-2xl">🪷</span>
            <span className="text-xs font-semibold">AR</span>
          </a>
          <a href="/sanjha-grove" className="nav-btn flex flex-col items-center gap-1 text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200 transition">
            <span className="text-2xl">🌳</span>
            <span className="text-xs font-semibold">Grove</span>
          </a>
        </nav>
        {/* App Shell Styles moved to TailwindCSS classes only */}
      </body>
    </html>
  );
}
