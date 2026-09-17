import { CalendarBlank, MapPin } from '@phosphor-icons/react'
import { createFileRoute, notFound } from '@tanstack/react-router'

import { EventArtwork, formatEventDate } from '@/components/site'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getEventBySlug } from '@/mocks/data'

export const Route = createFileRoute('/events/$eventSlug/')({
  loader: ({ params }) => {
    const event = getEventBySlug(params.eventSlug)
    if (!event) throw notFound()
    return event
  },
  component: EventPage,
})

function EventPage() {
  const event = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-3xl shadow-[0_24px_70px_-40px_rgba(15,42,90,0.8)]">
          <EventArtwork event={event} />
        </div>

        <section className="flex flex-col justify-center">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge className="rounded-full capitalize">{event.status}</Badge>
            <Badge variant="outline" className="rounded-full">
              Hosted by {event.host}
            </Badge>
          </div>
          <h1 className="font-heading text-4xl font-bold leading-tight tracking-[-0.035em] text-blue-950 sm:text-5xl">
            {event.name}
          </h1>
          <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p className="flex items-start gap-2">
              <CalendarBlank className="mt-0.5 text-blue-700" weight="bold" />
              <time dateTime={event.startsAt}>{formatEventDate(event.startsAt)}</time>
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 text-blue-700" weight="bold" />
              {event.location}
            </p>
          </div>
          <Separator className="my-7" />
          <h2 className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
            About this event
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            {event.description}
          </p>
        </section>
      </div>
    </main>
  )
}
