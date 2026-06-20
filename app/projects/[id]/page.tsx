import AppShell from "@/components/layout/AppShell";
import ProjectClient from "@/components/projects/ProjectClient";

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <ProjectClient projectId={params.id} />
    </AppShell>
  );
}
