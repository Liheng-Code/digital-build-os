import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Department, DISCIPLINE_FIELDS } from "@/lib/departmentMeta";

export function DisciplineMetaFields({
  department,
  value,
  onChange,
}: {
  department: Department | null;
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  if (!department) return null;
  const fields = DISCIPLINE_FIELDS[department];
  if (!fields?.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((f) => (
        <div key={f.key}>
          <Label htmlFor={`meta_${f.key}`}>{f.label}</Label>
          <Input
            id={`meta_${f.key}`}
            type={f.type}
            placeholder={f.placeholder}
            value={value[f.key] ?? ""}
            onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
