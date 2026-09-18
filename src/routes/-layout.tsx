import {
  ArrowRight,
  CalendarBlank,
  ChatCircleDots,
  Clock,
  FileText,
  Lightbulb,
  MapPin,
  UsersThree,
} from "@phosphor-icons/react";
import { Link, Outlet } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { EventCategory, EventSummary, Submission } from "@/types/events";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

const categoryDetails: Record<
  EventCategory,
  { label: string; icon: typeof Lightbulb }
> = {
  workshop: { label: "Workshop", icon: Lightbulb },
  trade: { label: "Information trade", icon: ChatCircleDots },
  collaboration: { label: "Collaboration", icon: UsersThree },
};

export function formatEventDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function Layout() {
  const { isModerator } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 font-heading text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Logo className="size-8 rounded-md" title="Hopamine" />
            <span className="truncate">
              <span className="hidden sm:inline">#HOPAMINE Virtual Events</span>
              <span className="sm:hidden">#HOPAMINE</span>
            </span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="flex items-center gap-1"
          >
            {isModerator ? (
              <Link
                to="/admin/events"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Admin dashboard
              </Link>
            ) : (
              <a
                href="/admin/events"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Moderator sign in
              </a>
            )}
            <a
              className={buttonVariants({ variant: "default", size: "sm" })}
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
            >
              Discord
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="mt-16">
        <Separator />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-8 sm:px-6 lg:px-8">
          <p className="font-heading text-sm font-medium">
            A community that turns optimism into action.
          </p>
          <p className="text-xs text-muted-foreground">Hope + Dopamine</p>
        </div>
      </footer>
    </div>
  );
}

export function EventArtwork({ event }: { event: EventSummary }) {
  const details = categoryDetails[event.category];
  const Icon = details.icon;

  if (event.imageUrl) {
    return (
      <img
        src={event.imageUrl}
        alt=""
        className={cn(
          "aspect-video w-full border-b object-cover",
          event.status === "past" && "opacity-70 grayscale",
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex aspect-video flex-col items-center justify-center gap-3 border-b bg-muted/50 text-muted-foreground",
        event.status === "past" && "opacity-70 grayscale",
      )}
      aria-label={`${details.label} event image placeholder`}
      role="img"
    >
      <Icon className="size-9" weight="duotone" aria-hidden="true" />
      <Badge variant="outline">{details.label}</Badge>
    </div>
  );
}

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Card
      size="sm"
      className={cn("relative", event.status === "past" && "bg-muted/30")}
    >
      <EventArtwork event={event} />
      <CardHeader>
        <CardTitle className="text-base leading-snug">
          <a
            href={`/events/${event.slug}`}
            className="outline-none after:absolute after:inset-0 focus-visible:underline"
          >
            {event.name}
          </a>
        </CardTitle>
        <CardDescription>Hosted by {event.host}</CardDescription>
        <CardAction>
          <Badge
            variant={event.status === "upcoming" ? "default" : "secondary"}
          >
            {event.status === "upcoming" ? "Upcoming" : "Past"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2 text-muted-foreground">
        <p className="flex items-start gap-2">
          <CalendarBlank
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <time dateTime={event.startsAt}>
            {formatEventDate(event.startsAt)}
          </time>
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{event.location}</span>
        </p>
      </CardContent>
      <CardFooter>
        <span className="flex w-full items-center justify-between font-medium">
          View event
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </CardFooter>
    </Card>
  );
}

export function SubmissionCard({
  submission,
  eventSlug,
}: {
  submission: Submission;
  eventSlug: string;
}) {
  return (
    <a
      href={`/events/${eventSlug}/submissions/${submission.id}`}
      className="block outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <Card size="sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Badge
              variant="secondary"
              className="size-8 px-0"
              aria-hidden="true"
            >
              <FileText className="size-4" />
            </Badge>
            <div className="min-w-0">
              <CardTitle>{submission.title}</CardTitle>
              <CardDescription className="mt-1">
                {submission.username} · Posted{" "}
                {formatEventDate(submission.createdAt)}
              </CardDescription>
            </div>
          </div>
          <CardAction>
            <ArrowRight
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardAction>
        </CardHeader>
      </Card>
    </a>
  );
}

export function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock;
  value: string;
  label: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <Badge variant="secondary" className="size-8 px-0" aria-hidden="true">
          <Icon className="size-4" weight="duotone" />
        </Badge>
        <span>
          <span className="block font-heading text-base font-medium">
            {value}
          </span>
          <span className="block text-xs text-muted-foreground">{label}</span>
        </span>
      </CardContent>
    </Card>
  );
}
