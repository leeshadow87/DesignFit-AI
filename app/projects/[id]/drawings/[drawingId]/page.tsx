import { redirect } from "next/navigation";

// /projects/[id]/drawings/[drawingId] → /drawings/[drawingId] 로 리디렉션
export default function DrawingRedirectPage({
  params,
}: {
  params: { id: string; drawingId: string };
}) {
  redirect(`/drawings/${params.drawingId}`);
}
