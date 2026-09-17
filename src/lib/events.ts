export type EventStatus = "upcoming" | "past";

export type EventCategory = "workshop" | "trade" | "collaboration";

export type EventSummary = {
  id: string;
  slug: string;
  name: string;
  host: string;
  startsAt: string;
  location: string;
  description: string;
  status: EventStatus;
  category: EventCategory;
};

export type SubmissionFile = {
  name: string;
  type: "DOCX" | "PDF" | "PNG" | "PPTX";
  size: string;
};

export type Submission = {
  id: string;
  eventId: string;
  username: string;
  title: string;
  description: string;
  createdAt: string;
  files: SubmissionFile[];
};

type EventsResponse = {
  events: EventSummary[];
};

export async function getEvents(): Promise<EventSummary[]> {
  const response = await fetch("/api/events?pageSize=100");

  if (!response.ok) {
    throw new Error("The events could not be loaded.");
  }

  const data = (await response.json()) as EventsResponse;
  return data.events;
}
