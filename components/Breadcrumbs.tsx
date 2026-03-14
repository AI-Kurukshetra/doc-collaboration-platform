"use client";

import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav className="mt-4 text-sm text-slate-200" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {isLast || !item.href ? (
                <span className="font-semibold text-white">{item.label}</span>
              ) : (
                <Link
                  className="text-slate-200 transition hover:text-white"
                  href={item.href}
                >
                  {item.label}
                </Link>
              )}
              {!isLast ? (
                <span className="text-slate-500">{">"}</span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
