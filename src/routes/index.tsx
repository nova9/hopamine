import { ArrowRight } from '@phosphor-icons/react'
import { createFileRoute, Link } from '@tanstack/react-router'

import { communityStats, EventCard, Stat } from '@/routes/-layout'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { events } from '@/mocks/data'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const upcomingEvents = events.filter((event) => event.status === 'upcoming')
const pastEvents = events
  .filter((event) => event.status === 'past')
  .toSorted(
    (first, second) => Date.parse(second.startsAt) - Date.parse(first.startsAt),
  )

function HomePage() {
  return (
    <main>
      <section className="border-b border-blue-950/10 bg-[linear-gradient(135deg,#eef6ff_0%,#ffffff_54%,#fff8cc_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.25fr_0.75fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <Badge className="mb-5 rounded-full bg-yellow-300 px-3 text-blue-950 hover:bg-yellow-300">
              Community-led · Open to everyone
            </Badge>
            <h1 className="max-w-4xl font-heading text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-blue-950 sm:text-5xl lg:text-6xl">
              Skills shared today become opportunities tomorrow.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Join Hopamine for practical workshops, information trades, and
              collaboration opportunities—then revisit every shared resource here.
            </p>
          </div>

          <div className="grid content-end gap-5 rounded-3xl border border-blue-950/10 bg-white/75 p-6 shadow-[0_24px_70px_-44px_rgba(15,42,90,0.8)] backdrop-blur sm:grid-cols-3 lg:grid-cols-1">
            {communityStats.map((stat) => (
              <Stat key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-heading text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
              Join the next room
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-blue-950">
              Current events
            </h2>
          </div>
          <p className="hidden max-w-sm text-right text-sm leading-6 text-slate-500 md:block">
            Event pages collect the schedule, description, and community submissions in
            one place.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      <section className="bg-blue-50/70">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 font-heading text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Community archive
              </p>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-blue-950">
                Past events
              </h2>
            </div>
            <Link
              to="/events/past"
              className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full')}
            >
              See all past events
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pastEvents.slice(0, 5).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
