type PageHeaderProps = {
  title: string;
  description?: string;
};

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="page-header mb-8 ui-fade-in">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm text-zinc-400 max-w-2xl leading-relaxed">
          {description}
        </p>
      ) : null}
    </header>
  );
}
