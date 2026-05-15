import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ErrorState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Something needs attention</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      {action && <div className="mt-4">{action}</div>}
    </Alert>
  );
}
