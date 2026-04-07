import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground">
        Otaku Dex needs a connection for search and your list. Reconnect and
        try again.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Go home
      </Link>
    </div>
  );
}
