import { ArrowLeft, Plus } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getEvent, getSubmissions } from "@/lib/events";
import { SubmissionCard } from "@/routes/-layout";

export const Route = createFileRoute("/events/$eventSlug/submissions/")({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { eventSlug } = Route.useParams();
  const eventQuery = useQuery({
    queryKey: ["events", eventSlug],
    queryFn: () => getEvent(eventSlug),
  });
  const submissionsQuery = useQuery({
    queryKey: ["submissions", eventSlug],
    queryFn: () => getSubmissions(eventSlug),
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/events/$eventSlug"
        params={{ eventSlug }}
        className={`${buttonVariants({ variant: "ghost" })} mb-4`}
      >
        <ArrowLeft data-icon="inline-start" aria-hidden="true" />
        Back to event
      </Link>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {eventQuery.data?.name}
          </p>
          <h1 className="font-heading text-3xl font-medium">Submissions</h1>
        </div>
        {eventQuery.data?.status === "upcoming" && (
          <Link
            to="/events/$eventSlug/submissions/new"
            params={{ eventSlug }}
            className={buttonVariants()}
          >
            <Plus aria-hidden="true" />
            Add submission
          </Link>
        )}
      </div>

      {submissionsQuery.isPending && (
        <p className="text-sm text-muted-foreground">Loading submissions…</p>
      )}
      {submissionsQuery.data?.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No submissions yet</EmptyTitle>
            <EmptyDescription>Shared resources will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <div className="grid gap-3">
        {submissionsQuery.data?.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            eventSlug={eventSlug}
          />
        ))}
      </div>
    </main>
  );
}
