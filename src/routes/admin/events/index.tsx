import {
  ArrowRight,
  CalendarBlank,
  CalendarPlus,
  LockKey,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEvents } from "@/lib/events";
import { formatEventDate } from "@/routes/-layout";
import type { ModeratorSession } from "@/types/events";

export const Route = createFileRoute("/admin/events/")({
  component: AdminEventsPage,
});

async function getModeratorSession() {
  const response = await fetch("/api/admin/session");

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "This area requires a moderator account through Cloudflare Access."
        : "Moderator access could not be verified.",
    );
  }

  return (await response.json()) as ModeratorSession;
}

function AdminEventsPage() {
  const sessionQuery = useQuery({
    queryKey: ["moderator-session"],
    queryFn: getModeratorSession,
    retry: false,
  });
  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
    enabled: sessionQuery.isSuccess,
  });

  if (sessionQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Verifying moderator access…</p>
      </main>
    );
  }

  if (sessionQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <LockKey aria-hidden="true" />
          <AlertTitle>Moderator access required</AlertTitle>
          <AlertDescription>{sessionQuery.error.message}</AlertDescription>
        </Alert>
        <Link to="/" className={`${buttonVariants({ variant: "outline" })} mt-4`}>
          Return to public events
        </Link>
      </main>
    );
  }

  const events = eventsQuery.data ?? [];
  const upcomingCount = events.filter((event) => event.status === "upcoming").length;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge variant="secondary" className="mb-3">
            <LockKey aria-hidden="true" />
            Moderator workspace
          </Badge>
          <h1 className="font-heading text-3xl font-medium tracking-tight">Event management</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {sessionQuery.data.moderator.email}
          </p>
        </div>
        <Link to="/admin/events/new" className={buttonVariants()}>
          <CalendarPlus data-icon="inline-start" aria-hidden="true" />
          Create event
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <Badge variant="secondary" className="size-8 px-0" aria-hidden="true">
              <CalendarBlank className="size-4" />
            </Badge>
            <div>
              <p className="font-heading text-lg font-medium">{upcomingCount}</p>
              <p className="text-muted-foreground">Upcoming events</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="font-heading text-lg font-medium">{events.length}</p>
            <p className="text-muted-foreground">Total events</p>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="managed-events-heading">
        <h2 id="managed-events-heading" className="mb-4 font-heading text-xl font-medium">
          All events
        </h2>

        {eventsQuery.isPending && (
          <p className="text-sm text-muted-foreground">Loading events…</p>
        )}
        {eventsQuery.isError && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load events</AlertTitle>
            <AlertDescription>{eventsQuery.error.message}</AlertDescription>
          </Alert>
        )}
        {eventsQuery.isSuccess && events.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No events yet</CardTitle>
              <CardDescription>Create the first official Hopamine event.</CardDescription>
            </CardHeader>
          </Card>
        )}
        <div className="grid gap-3">
          {events.map((event) => (
            <Card key={event.id} size="sm">
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>
                  {formatEventDate(event.startsAt)} · Hosted by {event.host}
                </CardDescription>
                <CardAction>
                  <Badge variant={event.status === "upcoming" ? "default" : "secondary"}>
                    {event.status === "upcoming" ? "Upcoming" : "Past"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="justify-end">
                <a href={`/events/${event.slug}`} className={buttonVariants({ variant: "outline" })}>
                  View public page
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
