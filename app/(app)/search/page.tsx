import { PageHeader } from "@/components/ui";
import { SearchClient } from "@/components/search-client";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div>
      <PageHeader
        title="Search"
        description="Find anything across your courses — documents, summaries, flashcards, and quizzes."
      />
      <SearchClient initialQuery={q ?? ""} />
    </div>
  );
}
