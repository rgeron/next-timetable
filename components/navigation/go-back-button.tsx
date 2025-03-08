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
      className={`w-full justify-center ${props.className || ""}`}
    >
      <ArrowLeft className="size-4" />
      Go Back
    </Button>
  );
}
