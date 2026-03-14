"use client";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="mt-3">
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      {subtitle ? (
        <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
      ) : null}
    </section>
  );
}
