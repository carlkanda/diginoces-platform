"use client";

import { useState } from "react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";

const retentionActions = [
  "archive",
  "cancel_pending_deletion",
  "extend_retention",
  "mark_completed",
  "mark_pending_deletion",
] as const;

type RetentionAction = (typeof retentionActions)[number];

const retentionActionSet = new Set<string>(retentionActions);

export function RetentionActionFields() {
  const [action, setAction] = useState<RetentionAction>("mark_completed");
  const requiresExtendedUntil = action === "extend_retention";
  const today = new Intl.DateTimeFormat("en-CA").format(new Date());

  return (
    <>
      <Field>
        <FieldLabel htmlFor="retention-action">Retention action</FieldLabel>
        <NativeSelect
          className="w-full"
          id="retention-action"
          name="action"
          onChange={(event) => {
            const nextAction = event.currentTarget.value;

            if (retentionActionSet.has(nextAction)) {
              setAction(nextAction as RetentionAction);
            }
          }}
          required
          value={action}
        >
          <NativeSelectOption value="mark_completed">
            Mark retention complete
          </NativeSelectOption>
          <NativeSelectOption value="archive">
            Archive project files
          </NativeSelectOption>
          <NativeSelectOption value="extend_retention">
            Extend retention date
          </NativeSelectOption>
          <NativeSelectOption value="mark_pending_deletion">
            Mark deletion pending
          </NativeSelectOption>
          <NativeSelectOption value="cancel_pending_deletion">
            Cancel pending deletion
          </NativeSelectOption>
        </NativeSelect>
        <FieldDescription>
          Select the lifecycle update that should be recorded for the wedding
          file vault.
        </FieldDescription>
      </Field>

      {requiresExtendedUntil ? (
        <Field>
          <FieldLabel htmlFor="extendedUntil">
            Extend retention through
          </FieldLabel>
          <Input
            aria-describedby="extendedUntil-help"
            id="extendedUntil"
            min={today}
            name="extendedUntil"
            required
            type="date"
          />
          <FieldDescription id="extendedUntil-help">
            Choose the new retention end date.
          </FieldDescription>
        </Field>
      ) : null}
    </>
  );
}
