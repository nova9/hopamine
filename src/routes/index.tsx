import { ArrowRight, Briefcase, CalendarBlank, FileText } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getEvents } from "@/lib/events";
import { EventCard, Stat } from "@/routes/-layout";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
  });
  const events = eventsQuery.data ?? [];
  const upcomingEvents = events.filter((event) => event.status === "upcoming");
  const pastEvents = events
    .filter((event) => event.status === "past")
    .toSorted(
      (first, second) => Date.parse(second.startsAt) - Date.parse(first.startsAt),
    );
  const communityStats = [
    { icon: CalendarBlank, value: String(upcomingEvents.length), label: "upcoming events" },
    { icon: FileText, value: "Public", label: "shared resources" },
    { icon: Briefcase, value: String(pastEvents.length), label: "past events" },
  ];

  return (
    <main>
      <section aria-labelledby="page-heading">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8 lg:py-16">
          <div className="max-w-3xl self-center">
            <Badge variant="secondary" className="mb-4">
              Community-led · Open to everyone
            </Badge>
            <h1
              id="page-heading"
              className="font-heading text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl"
            >
              Join us for workshops, information trades, and opportunities to
              collaborate.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Discover upcoming Hopamine events and revisit the resources shared by
              community members after every session.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {communityStats.map((stat) => (
              <Stat key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <section aria-labelledby="current-events-heading">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-2xl">
            <Badge variant="outline" className="mb-3">
              Upcoming
            </Badge>
            <h2
              id="current-events-heading"
              className="font-heading text-2xl font-medium tracking-tight sm:text-3xl"
            >
              Current events
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              View event details, prepare for the session, and share a submission.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {eventsQuery.isPending && (
              <p className="text-sm text-muted-foreground">Loading events…</p>
            )}
            {eventsQuery.isError && (
              <Alert variant="destructive" className="md:col-span-2 xl:col-span-3">
                <AlertTitle>Unable to load events</AlertTitle>
                <AlertDescription>{eventsQuery.error.message}</AlertDescription>
              </Alert>
            )}
            {eventsQuery.isSuccess && upcomingEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">
                There are no upcoming events yet.
              </p>
            )}
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <section aria-labelledby="past-events-heading" className="bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-3">
                Archive
              </Badge>
              <h2
                id="past-events-heading"
                className="font-heading text-2xl font-medium tracking-tight sm:text-3xl"
              >
                Past events
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Revisit completed sessions and the resources shared by the community.
              </p>
            </div>
            <a
              href="/events/past"
              className={buttonVariants({ variant: "outline" })}
            >
              See all past events
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {eventsQuery.isPending && (
              <p className="text-sm text-muted-foreground">Loading events…</p>
            )}
            {eventsQuery.isError && (
              <Alert variant="destructive" className="md:col-span-2 xl:col-span-3">
                <AlertTitle>Unable to load events</AlertTitle>
                <AlertDescription>{eventsQuery.error.message}</AlertDescription>
              </Alert>
            )}
            {eventsQuery.isSuccess && pastEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">
                There are no past events yet.
              </p>
            )}
            {pastEvents.slice(0, 5).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
