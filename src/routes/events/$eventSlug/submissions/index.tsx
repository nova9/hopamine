import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react";
import { getEvent, getSubmissions } from "@/lib/events";
import { SubmissionCard } from "@/routes/-layout";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export const Route=createFileRoute("/events/$eventSlug/submissions/")({component:SubmissionsPage});
function SubmissionsPage(){const {eventSlug}=Route.useParams();const event=useQuery({queryKey:["events",eventSlug],queryFn:()=>getEvent(eventSlug)});const submissions=useQuery({queryKey:["submissions",eventSlug],queryFn:()=>getSubmissions(eventSlug)});return <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">{event.data?.name}</p><h1 className="font-heading text-3xl font-medium">Submissions</h1></div>{event.data?.status==="upcoming"&&<Link to="/events/$eventSlug/submissions/new" params={{eventSlug}} className={buttonVariants()}><Plus/>Add submission</Link>}</div>{submissions.isPending&&<p className="text-sm text-muted-foreground">Loading submissions…</p>}{submissions.data?.length===0&&<Empty><EmptyHeader><EmptyTitle>No submissions yet</EmptyTitle><EmptyDescription>Shared resources will appear here.</EmptyDescription></EmptyHeader></Empty>}<div className="grid gap-3">{submissions.data?.map(s=><SubmissionCard key={s.id} submission={s} eventSlug={eventSlug}/>)}</div></main>}
