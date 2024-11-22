export function InfoPageContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none">
      {children}
    </article>
  );
}
