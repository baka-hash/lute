import type { CSSProperties } from "react";

/* Section 5 · Industry sectors (Figma "secction 4", 75:12315), 1440 × 736 */

const ROWS = [
  { word: "Manufacturing", tasks: ["Assembly", "Inspection", "Pick and place"], side: "right" as const },
  { word: "Logistics", tasks: ["Loading", "Machine tending"], side: "left" as const, width: 193 },
  { word: "Retail", tasks: ["Replenishment", "Order picking", "Shelf auditing"], side: "right" as const, width: 275 },
];

export default function Industries() {
  return (
    <section className="s5" id="industries" aria-labelledby="s5-title">
      <div className="s5-inner">
        <div className="s5-head">
          <p className="mono-xs s5-eyebrow" data-r="fade">(Industry sectors)</p>
          <h2 className="s5-title" id="s5-title" aria-label="The right solution starts with the job.">
            <span className="s5-h" style={{ left: 301, top: 0 }} data-r="line" aria-hidden="true">The right solution </span>
            <span className="s5-h" style={{ left: 523, top: 46 }} data-r="line" aria-hidden="true">starts with the job.</span>
          </h2>
        </div>
        <ul className="s5-list">
          {ROWS.map((row, r) => {
            const word = <h3 className="s5-word"><span>{row.word}</span></h3>;
            // rows rise in turn; pills follow inside their row
            const pills = (
              <ul
                className={`s5-pills s5-pills--${row.side}`}
                aria-label={`${row.word} tasks`}
                style={row.width ? { width: row.width } : undefined}
              >
                {row.tasks.map((t, i) => (
                  <li key={t} className={row.word === "Manufacturing" && i === 2 ? "s5-break" : undefined} style={{ "--i": i } as CSSProperties}>{t}</li>
                ))}
              </ul>
            );
            return (
              <li
                key={row.word}
                className={row.side === "left" ? "s5-item s5-item--end" : "s5-item"}
                data-r="row"
                style={{ "--dl": `${200 + r * 140}ms` } as CSSProperties}
              >
                {row.side === "left" ? <>{pills}{word}</> : <>{word}{pills}</>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
