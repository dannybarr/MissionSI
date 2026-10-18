import { createFileRoute } from "@tanstack/react-router";
import LandingApp from "@/landing/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mission — a personal AI memory you own and carry" },
      {
        name: "description",
        content:
          "Mission is a personal AI memory kept encrypted on a device you own. Bring it to the agents you choose, share only what a session needs, unplug to stop future access. In development.",
      },
      { property: "og:title", content: "Mission — your memory, on you" },
      {
        property: "og:description",
        content:
          "A personal AI memory, encrypted on a device you own. Model and agent agnostic. In development; not taking orders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#eae9e7" },
    ],
  }),
  component: Index,
});

function Index() {
  return <LandingApp />;
}
