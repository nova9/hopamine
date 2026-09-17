import { Button } from "@/components/ui/button"

type EventStatus = "upcoming" | "past";

type EventSummary = {
  id: string;
  name: string;
  host: string;
  startsAt: string;
  location: string;
  imageUrl: string;
  status: EventStatus;
};

const events: EventSummary[] = [
  {
    id: "1",
    name: "Portfolio Workshop",
    host: "Hopamine Mods",
    startsAt: "2026-10-10T18:00:00+05:30",
    location: "Hopamine Discord",
    imageUrl: "/favicon.svg",
    status: "upcoming",
  },
  {
    id: "2",
    name: "Community Information Trade",
    host: "Example Host",
    startsAt: "2026-08-15T18:00:00+05:30",
    location: "Hopamine Discord",
    imageUrl: "/favicon.svg",
    status: "past",
  },
];

function EventCard({ event }: { event: EventSummary }) {
  return (
    <article>
      <img src={event.imageUrl} alt="" width="96" height="96" />

      <div>
        <h3>{event.name}</h3>
        <p>Hosted by {event.host}</p>
        <p>{event.startsAt}</p>
        <p>{event.location}</p>
      </div>
    </article>
  );
}

function App() {
  const upcomingEvents = events.filter((event) => event.status === "upcoming");

  const pastEvents = events
    .filter((event) => event.status === "past")
    .slice(0, 5);

  return (
    <>
      <header>{/* Logo/title, Contact, Discord link */}</header>

      <main>
        <h1>
          Join us for skills-building workshops, information trades, and
          collaboration opportunities.
        </h1>

        <section>
          <h2>Current events</h2>

          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>

        <section>
          <h2>Past events</h2>

          {pastEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}

          <a href="/events/past">See all past events</a>
        </section>
      </main>

      <footer>
        <p>A Community that turns optimism into action!</p>
        <p>Hope + Dopamine</p>
      </footer>
    </>
  );
}

export default App;
