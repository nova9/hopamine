import { createFileRoute } from '@tanstack/react-router'

import { EventCard } from '@/routes/-layout'
import { events } from '@/mocks/data'

export const Route = createFileRoute('/events/past')({
  component: PastEventsPage,
})

const pastEvents = events
  .filter((event) => event.status === 'past')
  .toSorted(
    (first, second) => Date.parse(second.startsAt) - Date.parse(first.startsAt),
  )

function PastEventsPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <p className="mb-2 font-heading text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
        Community archive
      </p>
      <h1 className="font-heading text-4xl font-bold tracking-tight text-blue-950">
        Past events
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        Browse previous sessions and revisit the resources shared by the community.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {pastEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </main>
  )
}
