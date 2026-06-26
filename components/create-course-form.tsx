"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createCourse } from "@/app/actions/courses";
import { Button, Card, inputClass } from "./ui";
import { SubmitButton } from "./submit-button";

export function CreateCourseForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} /> New course
      </Button>
    );
  }

  return (
    <Card className="w-full p-4">
      <form action={createCourse} className="space-y-3">
        <input
          name="title"
          required
          autoFocus
          placeholder="Course title (e.g. Organic Chemistry)"
          className={inputClass}
        />
        <textarea
          name="description"
          rows={2}
          placeholder="Short description (optional)"
          className={inputClass}
        />
        <div className="flex gap-2">
          <SubmitButton pendingText="Creating…">Create course</SubmitButton>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
