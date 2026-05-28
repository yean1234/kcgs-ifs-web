export interface MeshyPromptParts {
  subject: string;
  modifiers?: readonly string[];
  styles?: readonly string[];
}

function normalizePart(part: string): string {
  return part.trim().replace(/\s+/g, " ");
}

export function buildMeshyPrompt({
  subject,
  modifiers = [],
  styles = [],
}: MeshyPromptParts): string {
  const clauses = [subject, ...modifiers, ...styles]
    .map(normalizePart)
    .filter((part) => part.length > 0);

  return clauses.join(", ");
}
