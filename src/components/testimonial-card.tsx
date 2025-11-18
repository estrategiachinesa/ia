import Image from "next/image";
import { Star, UserCircle2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TestimonialCardProps = {
  name: string;
  location: string;
  testimonial: string;
};

const HighlightedText = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
  return (
    <blockquote className="text-muted-foreground italic text-lg text-center leading-relaxed">
      “
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong
            key={index}
            className="font-semibold text-accent-foreground not-italic mx-1"
          >
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
      ”
    </blockquote>
  );
};

export default function TestimonialCard({
  name,
  location,
  testimonial,
}: TestimonialCardProps) {
  const highlightedText = testimonial;
  return (
    <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg bg-card">
      <CardContent className="pt-6">
        <div className="flex justify-center mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 text-accent fill-accent" />
          ))}
        </div>
        <HighlightedText text={highlightedText} />
      </CardContent>
      <CardFooter className="flex flex-col items-center mt-4">
        <UserCircle2 className="h-16 w-16 mb-2 text-muted-foreground" />
        <p className="font-bold font-headline text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">{location}</p>
      </CardFooter>
    </Card>
  );
}
