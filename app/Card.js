"use client";

import { useActionState, useState } from "react";
import { setGoal } from "./actions";

const INITIAL = { goal: null, at: null };

/**
 * A client component whose branch is chosen by a server prop, with a two-step
 * useState reveal, and a form whose success replaces the branch it lives in.
 */
export function Card({ goal: serverGoal }) {
  const [chosen, setChosen] = useState(null);
  const [state, formAction] = useActionState(setGoal, INITIAL);

  // The action returns the new value as plain data. When this reproduces, even
  // this never arrives: the component does not re-render at all.
  const goal = state.goal ?? serverGoal;

  if (goal === null) {
    return (
      <div>
        <h2>What are you working towards?</h2>

        {chosen === null ? (
          <button type="button" onClick={() => setChosen("conversational")}>
            Talking with people
          </button>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="goal" value={chosen} />
            <button type="submit">Set goal</button>
          </form>
        )}
      </div>
    );
  }

  return <p>goal is {goal}</p>;
}
