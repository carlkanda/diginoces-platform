"use client";

import { useState } from "react";

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
      <label>
        Action
        <select
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
          <option value="mark_completed">Mark completed</option>
          <option value="archive">Archive project</option>
          <option value="extend_retention">Extend retention</option>
          <option value="mark_pending_deletion">Mark pending deletion</option>
          <option value="cancel_pending_deletion">
            Cancel pending deletion
          </option>
        </select>
      </label>
      {requiresExtendedUntil ? (
        <label>
          Extend until
          <input
            aria-describedby="extendedUntil-help"
            min={today}
            name="extendedUntil"
            required
            type="date"
          />
          <small id="extendedUntil-help">
            Required when extending retention.
          </small>
        </label>
      ) : null}
    </>
  );
}
