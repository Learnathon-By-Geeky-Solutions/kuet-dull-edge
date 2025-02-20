import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | ScholrFlow",
  description: "Best in the East & West",
};


export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center ">
      {/* Header Section */}
      <header className="w-full max-w-md text-center mb-8">
        <h1 className="text-4xl font-semibold text-primary">Sign Up</h1>
        <p className="text-sm text-gray-500">Welcome! Let&apos;s board in.</p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md p-6 bg-base-300 shadow-lg rounded-lg">
        {children}
      </main>

      {/* Footer Section */}
      <footer className="mt-8">
      </footer>
    </div>
  );
}