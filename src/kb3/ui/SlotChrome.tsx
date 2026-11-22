"use client";
import { GameCharacter } from "@/lib/kb2/imageLoader";
import { ParticleField } from "../motion/particles";

export type Mood = "idle" | "win" | "freespin";

export function SlotChrome({ slug, accent, accent2, mood }: { slug: string; accent: string; accent2: string; mood?: Mood }) {
  return (
    <div className="kb3-chrome" aria-hidden="true">
      <div className="kb3-bg" style={{ backgroundImage: "url(/assets/" + slug + "/bg.jpg)" }}/>
      <div className="kb3-bg-dim"/>
      <ParticleField accent={accent2} density={22}/>
      <div className={"kb3-mascot kb3-mood-" + (mood || "idle")}>
        <GameCharacter slug={slug} hue={accent} size={230} mood={mood || "idle"}/>
      </div>
    </div>
  );
}
