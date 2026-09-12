import { useNavigate } from "react-router";
import { listProcessGroups } from "@/data";

/** The sidebar's stand-in below 900px — a dropdown in the toolbar (PRD 8.8). */
export function ProcessSelect({ activeId }: { activeId: string }) {
  const navigate = useNavigate();

  return (
    <label className="flex items-center">
      <span className="sr-only">Pilih proses</span>
      <select
        value={activeId}
        onChange={(event) => navigate(`/level-1/${event.target.value}`)}
        className="h-8 max-w-44 border border-line bg-white px-2 text-label text-ink"
      >
        {activeId === "" ? (
          <option value="" disabled>
            Pilih proses
          </option>
        ) : null}
        {listProcessGroups().map((group) => (
          <optgroup key={group.id} label={`${group.id} · ${group.group.n}`}>
            {group.processes.map((process) => (
              <option key={process.id} value={process.id}>
                {process.id} · {process.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
