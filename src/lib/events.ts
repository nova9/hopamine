import type { EventSummary, EventsResponse } from "@/types/events";

export async function getEvents(): Promise<EventSummary[]> {
  const response = await fetch("/api/events?pageSize=100");

  if (!response.ok) {
    throw new Error("The events could not be loaded.");
  }

  const data = (await response.json()) as EventsResponse;
  return data.events;
}
