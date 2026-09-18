import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getEvents } from "@/lib/events";
import { EventCard } from "@/routes/-layout";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export const Route = createFileRoute("/events/past")({ component: PastEventsPage });
const PAGE_SIZE = 9;
function PastEventsPage() {
  const [page,setPage]=useState(1); const query=useQuery({queryKey:["events"],queryFn:getEvents});
  const events=(query.data??[]).filter(e=>e.status==="past").toSorted((a,b)=>Date.parse(b.startsAt)-Date.parse(a.startsAt));
  const pages=Math.max(1,Math.ceil(events.length/PAGE_SIZE)); const shown=events.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  return <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><Badge variant="outline" className="mb-3">Archive</Badge><h1 className="font-heading text-3xl font-medium">Past events</h1><p className="mt-2 mb-8 text-muted-foreground">Browse every completed Hopamine session and its community resources.</p>
    {query.isPending&&<p className="text-sm text-muted-foreground">Loading events…</p>}{query.isSuccess&&events.length===0&&<Empty><EmptyHeader><EmptyTitle>No past events</EmptyTitle><EmptyDescription>Completed sessions will appear here.</EmptyDescription></EmptyHeader></Empty>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map(event=><EventCard key={event.id} event={event}/>)}</div>
    {pages>1&&<Pagination className="mt-8"><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={e=>{e.preventDefault();setPage(Math.max(1,page-1))}}/></PaginationItem><PaginationItem className="px-3 text-sm">Page {page} of {pages}</PaginationItem><PaginationItem><PaginationNext href="#" onClick={e=>{e.preventDefault();setPage(Math.min(pages,page+1))}}/></PaginationItem></PaginationContent></Pagination>}
  </main>;
}
