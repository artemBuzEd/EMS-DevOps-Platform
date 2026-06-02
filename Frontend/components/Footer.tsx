const LINKS = ["Privacy Policy", "Terms of Service", "Cookie Settings", "Global Contact"];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/[0.07]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:px-8">
        <span className="text-base font-semibold tracking-[-0.02em]">EventPro</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 sm:ml-6">
          {LINKS.map((l) => (
            <span
              key={l}
              className="cursor-pointer text-xs text-on-surface-variant transition-colors hover:text-on-surface"
            >
              {l}
            </span>
          ))}
        </nav>
        <span className="text-xs text-muted sm:ml-auto">
          © 2024 EventPro Orchestration. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
