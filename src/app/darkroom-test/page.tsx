"use client";
import dynamic from "next/dynamic";
const DarkroomViewer = dynamic(() => import("@/components/darkroom/DarkroomViewer"), { ssr: false });
export default function TestPage() {
  const photos = [
    { photoUrl: "/assets/darkroom/photo-01-portrait.webp", subject: "Portrait" },
    { photoUrl: "/assets/darkroom/photo-02-cafe.webp", subject: "Cafe" },
    { photoUrl: "/assets/darkroom/photo-03-musician.webp", subject: "Musician" },
    { photoUrl: "/assets/darkroom/photo-04-car.webp", subject: "Car" },
    { photoUrl: "/assets/darkroom/photo-05-field.webp", subject: "Field" },
    { photoUrl: "/assets/darkroom/photo-06-tokyo.webp", subject: "Tokyo" },
    { photoUrl: "/assets/darkroom/photo-07-flowers.webp", subject: "Flowers" },
    { photoUrl: "/assets/darkroom/photo-08-bookshop.webp", subject: "Bookshop" },
  ];
  return <DarkroomViewer photos={photos} albumTitle="Test" backHref="/" backLabel="Back" />;
}
