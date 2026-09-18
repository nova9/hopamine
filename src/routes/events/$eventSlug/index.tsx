import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  DownloadSimple,
  FileText,
  MapPin,
  UserCircle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getEvent } from "@/lib/events";
import { useAuth } from "@/contexts/auth-context";
import { EventArtwork, formatEventDate } from "@/routes/-layout";

export const Route = createFileRoute("/events/$eventSlug/")({
  component: EventDetailPage,
});

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function EventDetailPage() {
  const { eventSlug } = Route.useParams();
  const { isModerator } = useAuth();
  const eventQuery = useQuery({
    queryKey: ["events", eventSlug],
    queryFn: () => getEvent(eventSlug),
  });

  if (eventQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Loading event…</p>
      </main>
    );
  }

  if (eventQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertTitle>Unable to open event</AlertTitle>
          <AlertDescription>{eventQuery.error.message}</AlertDescription>
        </Alert>
        <a href="/" className={`${buttonVariants({ variant: "outline" })} mt-4`}>
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Back to events
        </a>
      </main>
    );
  }

  const event = eventQuery.data;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Events</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{event.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="space-y-6">
          <Card className="py-0">
            <EventArtwork event={event} />
            <CardHeader className="pt-5 sm:px-6">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant={event.status === "upcoming" ? "default" : "secondary"}>
                  {event.status === "upcoming" ? "Upcoming" : "Past event"}
                </Badge>
                <Badge variant="outline">Hosted by {event.host}</Badge>
              </div>
              <CardTitle className="font-heading text-2xl leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                <h1>{event.name}</h1>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6 text-base leading-7 sm:px-6">
              <Separator className="mb-6" />
              <h2 className="mb-3 font-heading text-lg font-medium">About this event</h2>
              <p className="whitespace-pre-line text-muted-foreground">{event.description}</p>
            </CardContent>
          </Card>

          {event.presentation && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Event file</CardTitle>
                <CardDescription>
                  {event.presentation.name} · {formatFileSize(event.presentation.size)}
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-end">
                <a href={event.presentation.downloadUrl} className={buttonVariants({ variant: "outline" })}>
                  <DownloadSimple data-icon="inline-start" aria-hidden="true" />
                  Download
                </a>
              </CardFooter>
            </Card>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle>Event details</CardTitle>
              <CardDescription>Everything you need to join the session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <div className="flex items-start gap-3">
                <CalendarBlank className="mt-0.5 size-5 shrink-0 text-primary" weight="duotone" aria-hidden="true" />
                <div>
                  <p className="font-medium">Date and time</p>
                  <time className="text-muted-foreground" dateTime={event.startsAt}>{formatEventDate(event.startsAt)}</time>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" weight="duotone" aria-hidden="true" />
                <div>
                  <p className="font-medium">Virtual location</p>
                  <p className="text-muted-foreground">{event.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCircle className="mt-0.5 size-5 shrink-0 text-primary" weight="duotone" aria-hidden="true" />
                <div>
                  <p className="font-medium">Host</p>
                  <p className="text-muted-foreground">{event.host}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="size-8 px-0" aria-hidden="true">
                  <FileText className="size-4" />
                </Badge>
                <div>
                  <CardTitle>Community submissions</CardTitle>
                  <CardDescription className="mt-1">
                    {event.submissionCount === 1 ? "1 resource shared" : `${event.submissionCount} resources shared`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardFooter>
              <a
                href={`/events/${event.slug}/submissions`}
                className={`${buttonVariants()} w-full`}
              >
                Browse submissions
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </a>
            </CardFooter>
          </Card>
          {isModerator && event.status === "upcoming" && (
            <a href={`/admin/events/${event.slug}/edit`} className={`${buttonVariants({ variant: "outline" })} w-full`}>
              Edit event
            </a>
          )}
        </aside>
      </div>
    </main>
  );
}
