import SoundToggle from "@/components/sound-toggle";
import VideoGrid from "@/components/video-grid";
import { listVideoSources } from "@/lib/list-videos";

export default function Home() {
  return (
    <main className="h-svh px-frame-x py-frame-y">
      <h1 className="sr-only">look</h1>
      <VideoGrid sources={listVideoSources()} />
      <SoundToggle />
    </main>
  );
}
