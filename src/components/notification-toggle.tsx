import { Switch } from "#/components/ui/switch";
import { Separator } from "#/components/ui/separator";

export interface NotificationSettings {
  preGame: boolean;
  goingLive: boolean;
  scoreUpdate: boolean;
}

interface Props {
  settings: NotificationSettings;
  onUpdate: (key: keyof NotificationSettings, value: boolean) => void;
  loading?: boolean;
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}

export function NotificationToggle({
  settings,
  onUpdate,
  loading = false,
}: Props) {
  const rows: Array<{
    key: keyof NotificationSettings;
    label: string;
    description: string;
  }> = [
    {
      key: "preGame",
      label: "Pre-game alerts",
      description: "15 minutes before kickoff",
    },
    {
      key: "goingLive",
      label: "Going live alerts",
      description: "When a match you follow kicks off",
    },
    {
      key: "scoreUpdate",
      label: "Score update alerts",
      description: "Goals, points, and score changes",
    },
  ];

  return (
    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
      {rows.map((row, idx) => (
        <div key={row.key}>
          <ToggleRow
            label={row.label}
            description={row.description}
            checked={settings[row.key]}
            disabled={loading}
            onChange={(val) => onUpdate(row.key, val)}
          />
          {idx < rows.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}
