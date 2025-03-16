import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function ContinueButton(props: {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      onClick={props.onClick}
      disabled={props.disabled}
      className={`w-full justify-center bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 transition-all duration-300 shadow-sm ${
        props.className || ""
      }`}
    >
      Continuer
      <ArrowRight className="size-4 ml-2 animate-pulse-subtle" />
    </Button>
  );
}
