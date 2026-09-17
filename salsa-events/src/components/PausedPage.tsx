export function PausedPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          Salsa Events is temporarily paused
        </h1>
        <p className="mt-4 text-sm text-muted sm:text-base">
          For personal privacy and security reasons, this website has been temporarily put on
          pause.
        </p>
        <p className="mt-4 text-sm text-muted sm:text-base">
          If you have any questions, please contact the man himself Faruko.
        </p>
      </div>
    </div>
  );
}