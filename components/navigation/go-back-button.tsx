import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function GoBackButton(props: {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      onClick={props.onClick}
      disabled={props.disabled}
      variant="outline"
      className={`w-full justify-center border-primary/20 hover:border-primary/40 bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 ${
        props.className || ""
      }`}
    >
      <ArrowLeft className="size-4 mr-2 animate-pulse-subtle-reverse" />
      Retour
    </Button>
  );
}
