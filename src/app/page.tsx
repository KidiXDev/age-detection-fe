import AgeDetector from "@/components/AgeDetector";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-slate-800/15 to-gray-700/15 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-gray-800/15 to-slate-700/15 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"
          style={{ animationDelay: "3s" }}
        ></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-r from-slate-700/10 to-gray-800/10 rounded-full mix-blend-overlay filter blur-2xl float"></div>
      </div>

      <main className="container mx-auto py-8 relative z-10 flex-grow">
        <div className="fade-in">
          <AgeDetector />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 backdrop-blur-sm bg-slate-950/80 relative z-10 shadow-2xl mt-12">
        <div className="container mx-auto px-6 py-2 flex flex-col items-center justify-center min-h-24">
          {/* Bottom Footer */}
          <div className="pt-4 text-center w-full">
            <p className="text-slate-400 text-sm mb-2 tracking-wide font-medium">
              © 2025 AI Age Detector • KidiXDev & AlvanCP
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
