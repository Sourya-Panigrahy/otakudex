import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type BackLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/** Back navigation with a consistent icon (avoids raw ← in text). */
export function BackLink({ href, children, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium text-cyan-400 transition hover:text-cyan-300",
        className
      )}
    >
      <ArrowLeft className="size-4 shrink-0 stroke-[2]" aria-hidden />
      <span>{children}</span>
    </Link>
  );
}
