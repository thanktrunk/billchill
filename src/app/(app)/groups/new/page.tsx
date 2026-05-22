"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createGroup } from "./actions";

export default function NewGroupPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const group = await createGroup(formData);
      router.push(`/groups/${group.id}`);
    } catch {
      setPending(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Create Group</h1>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Group Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g., Trip to Japan"
          />
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium mb-1">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            className="w-full rounded-md border px-3 py-2 text-sm"
            defaultValue="USD"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="VND">VND</option>
            <option value="JPY">JPY</option>
            <option value="AUD">AUD</option>
            <option value="CAD">CAD</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create Group"}
        </button>
      </form>
    </div>
  );
}
