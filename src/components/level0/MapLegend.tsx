import { RasciBadge } from "@/components/shared/RasciBadge";
import { layout } from "@/data";
import { t } from "@/lib/i18n";

/** Legend — PRD 8.2 step 6: shapes, colours, line types, RASCI, and `L1 ·`. */
export function MapLegend({
  width,
  showConfirmation = false,
}: {
  width: number;
  /** Explain the orange tint while the confirmation layer is on. */
  showConfirmation?: boolean;
}) {
  const shapes = [
    { swatch: "bg-cyan", label: t("Kotak unit organisasi") },
    { swatch: "border border-line bg-paper", label: t("Langkah lajur profit center") },
    { swatch: "bg-navy", label: t("Blok kelompok proses") },
    { swatch: "bg-yellow", label: t("Pita kategori") },
    {
      swatch: "border-2 border-dashed border-navy",
      label: t("Komite independen"),
    },
  ];

  const lines = [
    { color: "bg-navy", style: "border-dotted", label: t("Garis koordinasi") },
    { color: "bg-yellow", style: "", label: t("Alur value chain") },
    {
      color: "bg-teal",
      style: "",
      label: t("Masukan, dukungan, dan keluaran"),
    },
  ];

  return (
    <section
      aria-label={t("Legenda peta")}
      className="print-avoid-break border border-line bg-white p-4"
      style={{ width }}
    >
      <h2 className="text-label font-demi text-ink">{t("Legenda")}</h2>

      <div className="mt-3 grid grid-cols-4 gap-6">
        <div>
          <h3 className="text-badge font-demi text-muted">{t("Bentuk dan warna")}</h3>
          <ul className="mt-1.5 flex flex-col gap-1">
            {shapes.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-3.5 w-6 shrink-0 ${item.swatch}`}
                />
                <span className="text-badge text-ink">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-badge font-demi text-muted">{t("Jenis garis")}</h3>
          <ul className="mt-1.5 flex flex-col gap-1">
            {lines.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={
                    item.style
                      ? `w-6 shrink-0 border-t-2 ${item.style} border-navy`
                      : `h-0.5 w-6 shrink-0 ${item.color}`
                  }
                />
                <span className="text-badge text-ink">{item.label}</span>
              </li>
            ))}
          </ul>

          {showConfirmation ? (
            <>
              <h3 className="mt-3 text-badge font-demi text-muted">
                {t("Status konfirmasi")}
              </h3>
              <p className="mt-1.5 flex items-start gap-2 text-badge text-ink">
                <span
                  aria-hidden="true"
                  className="mt-0.5 h-3.5 w-6 shrink-0 bg-orange/25 outline-2 outline-orange -outline-offset-2"
                />
                {t(
                  "Kotak bertanda oranye memuat peran RASCI yang masih menunggu konfirmasi pemilik proses.",
                )}
              </p>
            </>
          ) : null}

          <h3 className="mt-3 text-badge font-demi text-muted">{t("Kode Level 1")}</h3>
          <p className="mt-1.5 text-badge text-ink">
            <span className="font-medium text-cobalt">L1 · C4.2</span>{" "}
            {t("— proses Level 1 yang merinci kotak ini.")}
          </p>
        </div>

        <div className="col-span-2">
          <h3 className="text-badge font-demi text-muted">
            {t("Peran RASCI pada mode fokus tahapan")}
          </h3>
          <ul className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1">
            {layout.RAS.map((role) => (
              <li key={role} className="flex items-start gap-2">
                <RasciBadge role={role} size="sm" />
                <span className="text-badge text-ink">
                  <span className="font-medium">{layout.RAS_LBL[role]}</span> —{" "}
                  {layout.RAS_DESC[role]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
