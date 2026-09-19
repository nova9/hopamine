import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DownloadSimple, Eye, Trash, X } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { getSubmission } from "@/lib/events";
import { useAuth } from "@/contexts/auth-context";
import { formatEventDate } from "@/routes/-layout";
import { getSubmissionCategoryLabel } from "@/lib/submission-categories";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute(
  "/events/$eventSlug/submissions/$submissionId",
)({ component: SubmissionDetail });
const size = (n: number) =>
  n < 1048576 ? `${Math.ceil(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`;
function SubmissionDetail() {
  const params = Route.useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const client = useQueryClient();
  const [previewedFileId, setPreviewedFileId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["submission", params.submissionId],
    queryFn: () => getSubmission(params.eventSlug, params.submissionId),
  });
  const remove = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/admin/submissions/${params.submissionId}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("The submission could not be deleted.");
    },
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: ["submissions", params.eventSlug],
      });
      toast.success("Submission deleted");
      nav({
        to: "/events/$eventSlug/submissions",
        params: { eventSlug: params.eventSlug },
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (query.isPending)
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">Loading submission…</main>
    );
  if (query.isError)
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        {query.error.message}
      </main>
    );
  const { submission, event } = query.data;
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-sm text-muted-foreground">{event.name}</p>
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-medium">
            {submission.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            By {submission.username} · {formatEventDate(submission.submittedAt)}
          </p>
          <Badge variant="outline" className="mt-3">
            {getSubmissionCategoryLabel(submission.category)}
          </Badge>
        </div>
        {auth.isModerator && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="destructive">
                  <Trash />
                  Delete
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this submission?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes its uploaded files and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => remove.mutate()}>
                  Delete submission
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {submission.description}
          </p>
        </CardContent>
      </Card>
      <h2 className="mt-7 mb-3 font-heading text-xl font-medium">Files</h2>
      <div className="grid gap-3">
        {submission.files.map((file) => {
          const isPreviewing = previewedFileId === file.id;

          return (
            <Card key={file.id} size="sm">
              <CardHeader>
                <CardTitle>{file.name}</CardTitle>
                <CardDescription>
                  {size(file.size)}
                  {!file.previewUrl && " · Preview unavailable for this file type"}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex-wrap justify-end gap-2">
                {file.previewUrl && (
                  <Button
                    variant={isPreviewing ? "secondary" : "outline"}
                    onClick={() =>
                      setPreviewedFileId(isPreviewing ? null : file.id)
                    }
                    aria-expanded={isPreviewing}
                    aria-controls={`preview-${file.id}`}
                  >
                    {isPreviewing ? <X /> : <Eye />}
                    {isPreviewing ? "Close preview" : "Preview"}
                  </Button>
                )}
                <a
                  href={file.downloadUrl}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <DownloadSimple />
                  Download
                </a>
              </CardFooter>
              {isPreviewing && file.previewUrl && (
                <CardContent id={`preview-${file.id}`}>
                  <iframe
                    src={file.previewUrl}
                    title={`Preview of ${file.name}`}
                    className="h-[70vh] min-h-96 w-full rounded-md border bg-muted"
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}
