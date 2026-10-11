import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-full bg-[#e8f7fc] text-[var(--brand)] [&>svg]:size-6"
      >
        {icon ?? <Inbox />}
      </span>
      <p className="mt-3 font-semibold text-[#12233d]">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-[#5a6578]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
