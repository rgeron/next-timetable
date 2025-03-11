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
      className={`w-full justify-center ${props.className || ""}`}
    >
      Continuer
      <ArrowRight className="size-4" />
    </Button>
  );
}
