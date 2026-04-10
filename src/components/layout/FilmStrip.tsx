import Image from "next/image";

export default function FilmStrip() {
  return (
    <div
      className="relative w-full overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
      style={{ height: 60, background: "#050505" }}
    >
      <Image
        src="/assets/film-strip.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        style={{ opacity: 0.55, objectPosition: "center" }}
        draggable={false}
        priority
      />
    </div>
  );
}
