import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type MouseEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getEvents } from "@/lib/events";
import { EventCard } from "@/routes/-layout";

export const Route = createFileRoute("/events/past")({
  component: PastEventsPage,
});

const PAGE_SIZE = 9;

function PastEventsPage() {
  const [page, setPage] = useState(1);
  const eventsQuery = useQuery({ queryKey: ["events"], queryFn: getEvents });
  const pastEvents = (eventsQuery.data ?? [])
    .filter((event) => event.status === "past")
    .toSorted(
      (first, second) => Date.parse(second.startsAt) - Date.parse(first.startsAt),
    );
  const pageCount = Math.max(1, Math.ceil(pastEvents.length / PAGE_SIZE));
  const visibleEvents = pastEvents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function goToPage(event: MouseEvent<HTMLAnchorElement>, nextPage: number) {
    event.preventDefault();
    setPage(Math.min(pageCount, Math.max(1, nextPage)));
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge variant="outline" className="mb-3">
        Archive
      </Badge>
      <h1 className="font-heading text-3xl font-medium">Past events</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Browse every completed Hopamine session and its community resources.
      </p>

      {eventsQuery.isPending && (
        <p className="text-sm text-muted-foreground">Loading events…</p>
      )}
      {eventsQuery.isSuccess && pastEvents.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No past events</EmptyTitle>
            <EmptyDescription>Completed sessions will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {pageCount > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => goToPage(event, page - 1)}
              />
            </PaginationItem>
            <PaginationItem className="px-3 text-sm">
              Page {page} of {pageCount}
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => goToPage(event, page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </main>
  );
}
