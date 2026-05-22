"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { addExpense, getGroupMembers } from "./actions";

export default function NewExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [members, setMembers] = useState<{ id: string; displayName: string }[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const [splitMethod, setSplitMethod] = useState<"equal" | "amount" | "shares" | "percentage">("equal");

  useEffect(() => {
    params.then(({ id }) => {
      setGroupId(id);
      getGroupMembers(id).then(setMembers);
    });
  }, [params]);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await addExpense(groupId, formData, splitMethod);
      router.push(`/groups/${groupId}`);
    } catch {
      setPending(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Add Expense</h1>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g., Dinner"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-1">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="paidBy" className="block text-sm font-medium mb-1">
            Paid by
          </label>
          <select
            id="paidBy"
            name="paidBy"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Split method</label>
          <select
            value={splitMethod}
            onChange={(e) => setSplitMethod(e.target.value as typeof splitMethod)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="equal">Split equally</option>
            <option value="amount">By exact amounts</option>
            <option value="shares">By shares</option>
            <option value="percentage">By percentage</option>
          </select>
        </div>

        {splitMethod !== "equal" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {splitMethod === "amount" && "Enter exact amount for each member:"}
              {splitMethod === "shares" && "Enter share weight for each member:"}
              {splitMethod === "percentage" && "Enter percentage for each member:"}
            </p>
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <span className="text-sm w-32 truncate">{m.displayName}</span>
                <input
                  name={`split_${m.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={splitMethod === "shares" ? "1" : ""}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                  placeholder={splitMethod === "percentage" ? "%" : "0.00"}
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add Expense"}
        </button>
      </form>
    </div>
  );
}
