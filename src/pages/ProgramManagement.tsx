import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { ProgramTodoDrawer } from "@/components/programs/ProgramTodoDrawer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { createProgramTodo, deleteProgramTodo, updateProgramTodo } from "@/lib/api";
import { adminQueryKeys, programTodosQueryOptions } from "@/lib/adminQueries";
import { formatPodRole } from "@/lib/podRoles";
import {
  TALENT_PROGRAMS,
  programName,
  type ProgramTodo,
  type ProgramTodoWriteInput,
  type TalentProgramId,
} from "@/lib/programTodos";
import { cn } from "@/lib/utils";

function isNotFound(error: unknown) {
  return Boolean(error && typeof error === "object" && "status" in error && (error as { status?: number }).status === 404);
}

export default function ProgramManagement() {
  const queryClient = useQueryClient();
  const [programId, setProgramId] = useState<TalentProgramId>(TALENT_PROGRAMS[0].id);
  const [editor, setEditor] = useState<ProgramTodo | null | "new">(null);
  const todosQuery = useQuery(programTodosQueryOptions(programId));
  const notFound = todosQuery.isError && isNotFound(todosQuery.error);
  const todos = notFound ? [] : todosQuery.data ?? [];

  const saveMutation = useMutation({
    mutationFn: ({ todo, input }: { todo: ProgramTodo | null; input: ProgramTodoWriteInput }) =>
      todo ? updateProgramTodo(todo.id, input) : createProgramTodo(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.programTodos }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProgramTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.programTodos }),
  });

  function remove(todo: ProgramTodo) {
    if (window.confirm(`Remove “${todo.title}” from this program?`)) deleteMutation.mutate(todo.id);
  }

  async function save(input: ProgramTodoWriteInput) {
    await saveMutation.mutateAsync({ todo: editor && editor !== "new" ? editor : null, input });
  }

  const selectedName = programName(programId);

  return (
    <div>
      <PageHeader
        icon={ListChecks}
        title="Program Management"
        description="Todos a pod must finish before a program can activate. Due dates are set when a pod creates the todo."
      />

      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <nav
          aria-label="Programs"
          className="sticky top-0 z-20 -mx-3 mb-4 self-start border-b border-line bg-base/95 px-3 py-2 backdrop-blur-xl lg:mx-0 lg:mb-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
        >
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {TALENT_PROGRAMS.map((program) => {
              const selected = program.id === programId;
              return (
                <button
                  key={program.id}
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  onClick={() => setProgramId(program.id)}
                  className={cn(
                    "focus-ring shrink-0 rounded-xl px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap lg:w-full lg:whitespace-normal",
                    selected ? "bg-surface-2 text-ink" : "text-ink-muted hover:bg-surface-2/70 hover:text-ink",
                  )}
                >
                  {program.name}
                </button>
              );
            })}
          </div>
        </nav>

        <section aria-label={`${selectedName} todos`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">{selectedName}</h2>
              <p className="text-xs text-ink-faint">
                {notFound || todosQuery.isLoading
                  ? "Checklist"
                  : `${todos.length} ${todos.length === 1 ? "todo" : "todos"}`}
              </p>
            </div>
            <Button size="sm" onClick={() => setEditor("new")}>
              <Plus className="h-4 w-4" />
              Add todo
            </Button>
          </div>

          {todosQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
            </div>
          ) : todosQuery.isError && !notFound ? (
            <Card className="p-8 text-center">
              <p className="font-display font-bold text-ink">Program todos could not be loaded</p>
              <p className="mt-1 text-sm text-ink-muted">
                {todosQuery.error instanceof Error ? todosQuery.error.message : "Try again."}
              </p>
              <Button className="mt-4" variant="secondary" onClick={() => todosQuery.refetch()}>
                Try again
              </Button>
            </Card>
          ) : notFound || todos.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No todos for this program"
              description={
                todosQuery.error instanceof Error
                  ? todosQuery.error.message
                  : "Add the checklist the pod completes before this program can activate."
              }
              action={
                <Button onClick={() => setEditor("new")}>
                  <Plus className="h-4 w-4" />
                  Add todo
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                    <th className="px-4 py-2.5 font-medium">Todo</th>
                    <th className="px-4 py-2.5 font-medium">Role</th>
                    <th className="px-4 py-2.5 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todos.map((todo) => (
                    <tr key={todo.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">{todo.title}</td>
                      <td className="px-4 py-3 text-ink-muted">{formatPodRole(todo.role)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="secondary" onClick={() => setEditor(todo)}>
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="icon"
                            variant="danger"
                            aria-label={`Remove ${todo.title}`}
                            onClick={() => remove(todo)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ProgramTodoDrawer
        open={editor !== null}
        onClose={() => setEditor(null)}
        programId={programId}
        todo={editor && editor !== "new" ? editor : null}
        onSave={save}
        isSaving={saveMutation.isPending}
        saveError={saveMutation.error instanceof Error ? saveMutation.error.message : ""}
      />
      {deleteMutation.isError ? (
        <p className="mt-4 text-sm text-bad">
          {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Could not remove todo."}
        </p>
      ) : null}
    </div>
  );
}
