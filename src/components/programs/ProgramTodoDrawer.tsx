import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldRow, Input, Select } from "@/components/ui/Field";
import { POD_ROLES, type PodRoleApi } from "@/lib/podRoles";
import {
  TALENT_PROGRAMS,
  type ProgramTodo,
  type ProgramTodoWriteInput,
  type TalentProgramId,
} from "@/lib/programTodos";

interface FormState {
  programId: TalentProgramId;
  title: string;
  role: PodRoleApi | "";
}

export function ProgramTodoDrawer({
  open,
  onClose,
  programId,
  todo,
  onSave,
  isSaving,
  saveError,
}: {
  open: boolean;
  onClose: () => void;
  programId: TalentProgramId;
  todo: ProgramTodo | null;
  onSave: (input: ProgramTodoWriteInput) => Promise<void>;
  isSaving: boolean;
  saveError: string;
}) {
  const [form, setForm] = useState<FormState>({ programId, title: "", role: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(
      todo
        ? { programId: todo.programId, title: todo.title, role: todo.role }
        : { programId, title: "", role: "" },
    );
  }, [open, programId, todo]);

  async function submit() {
    if (!form.title.trim() || !form.role) {
      setError("Add a title and a role.");
      return;
    }
    try {
      await onSave({ programId: form.programId, title: form.title.trim(), role: form.role });
      onClose();
    } catch {
      /* Mutation error is displayed below. */
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={todo ? "Edit todo" : "Add todo"}
      subtitle="This is the checklist item a pod must finish before the program can activate."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {todo ? "Save changes" : "Add todo"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FieldRow label="Program">
          <Select
            value={form.programId}
            onChange={(event) => setForm((current) => ({ ...current, programId: event.target.value as TalentProgramId }))}
          >
            {TALENT_PROGRAMS.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </Select>
        </FieldRow>
        <FieldRow label="Todo">
          <Input
            autoFocus
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="What does the pod need to finish?"
          />
        </FieldRow>
        <FieldRow label="Role">
          <Select
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as PodRoleApi | "" }))}
          >
            <option value="">Select a role</option>
            {POD_ROLES.map((role) => (
              <option key={role.apiValue} value={role.apiValue}>
                {role.label}
              </option>
            ))}
          </Select>
        </FieldRow>
        {error || saveError ? (
          <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error || saveError}</p>
        ) : null}
      </div>
    </Drawer>
  );
}
