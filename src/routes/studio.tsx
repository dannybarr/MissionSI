import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const StudioAppLazy = lazy(() => import("@/studio/App"));

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Mission Studio" },
      {
        name: "description",
        content:
          "Mission Studio — design and render Mission hardware concepts in 3D.",
      },
      { property: "og:title", content: "Mission Studio" },
      {
        property: "og:description",
        content:
          "Mission Studio — design and render Mission hardware concepts in 3D.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  return (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}>
        <StudioAppLazy />
      </Suspense>
    </ClientOnly>
  );
}
