import {
  AlertTriangle,
  Bug,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Flag,
  type LucideIcon,
  Package,
  Sparkles,
  Tag,
  Users,
  Wrench,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ICON_OPTIONS: Record<string, LucideIcon> = {
  Sparkles,
  Wrench,
  Bug,
  ClipboardList,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Package,
  Calendar,
  Tag,
  Users,
};

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const SelectedIcon = ICON_OPTIONS[value];

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next ?? "")}
    >
      <SelectTrigger className="w-full">
        {SelectedIcon && <SelectedIcon className="size-4" />}
        <SelectValue placeholder="Select an icon" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ICON_OPTIONS).map(([name, Icon]) => (
          <SelectItem key={name} value={name}>
            <Icon className="size-4" />
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
