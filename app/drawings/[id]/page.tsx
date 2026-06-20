import AppShell from "@/components/layout/AppShell";
import DrawingAnalysisClient from "@/components/drawings/DrawingAnalysisClient";

export default function DrawingPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <DrawingAnalysisClient drawingId={params.id} />
    </AppShell>
  );
}
