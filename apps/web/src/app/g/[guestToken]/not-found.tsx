import { CalendarHeartIcon, ShieldAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PublicGuestPageNotFound() {
  return (
    <section className="public-route min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-3xl place-items-center">
        <Card className="w-full">
          <CardHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Diginoces RSVP</Badge>
              <Badge variant="outline">Personal invitation</Badge>
            </div>
            <CardTitle>
              <h1 className="flex items-center gap-2 text-3xl leading-tight tracking-normal text-balance">
                <CalendarHeartIcon aria-hidden="true" />
                Invitation link unavailable
              </h1>
            </CardTitle>
            <CardDescription className="text-base">
              This invitation link is invalid, expired, or has been revoked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <ShieldAlertIcon aria-hidden="true" />
              <AlertTitle>Ask for a fresh personal link</AlertTitle>
              <AlertDescription>
                Contact your Diginoces host if you need the invitation link to
                be shared again.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
