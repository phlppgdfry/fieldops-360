import { useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ArrowRight,
  Truck,
  ScanLine,
  ClipboardCheck,
  Workflow,
  TrendingUp,
} from "lucide-react";
const steps = [
  [
    Truck,
    "Een levering registreren",
    "De chauffeur legt werf, leverancier en hoeveelheden vast. Een afwijking boven 5% vereist een toelichting.",
    "Leveringen",
  ],
  [
    ScanLine,
    "Van bon naar gecontroleerde data",
    "Upload een bonfoto. De OCR leest de tekst; jij controleert het origineel en bevestigt de velden voordat je indient.",
    "Documentcontrole",
  ],
  [
    ClipboardCheck,
    "Een onafhankelijke goedkeuring",
    "Wissel naar de werfleider om de levering te beoordelen. Je kunt je eigen registratie niet goedkeuren.",
    "Goedkeuringen",
  ],
  [
    Workflow,
    "ERP-overdracht en herstel",
    "Bekijk de integratietaak, simuleer een storing en herstel die. De browserdemo simuleert de ERP-overdracht en bewaart het auditspoor.",
    "Automatisering",
  ],
  [
    TrendingUp,
    "De waarde onderbouwen",
    "Pas volumes, tijdswinst en kosten aan. De businesscase rekent met transparante aannames, zodat je de impact kunt bespreken.",
    "Businesscase",
  ],
];
export default function Tour({ onClose, onNavigate }) {
  const [index, setIndex] = useState(0),
    ref = useRef(null);
  const [Icon, title, description, target] = steps[index];
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    function key(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = ref.current.querySelectorAll(
          "button:not(:disabled),a[href]",
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="backdrop">
      <section
        ref={ref}
        tabIndex={-1}
        className="dialog tour"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        <header>
          <span className="muted">
            Rondleiding · {index + 1} van {steps.length}
          </span>
          <button aria-label="Rondleiding sluiten" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <Icon className="tour-icon" size={32} />
        <h2 id="tour-title">{title}</h2>
        <p>{description}</p>
        <div
          className="tour-progress"
          aria-label={`Stap ${index + 1} van ${steps.length}`}
        >
          {steps.map((s, i) => (
            <button
              key={s[1]}
              className={i === index ? "selected" : ""}
              aria-label={`Ga naar stap ${i + 1}`}
              aria-current={i === index ? "step" : undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button className="tour-open" onClick={() => onNavigate(target)}>
          Open {target.toLowerCase()}
          <ArrowRight size={16} />
        </button>
        <footer>
          <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
            <ChevronLeft size={16} />
            Vorige
          </button>
          <button
            className="primary"
            onClick={() =>
              index === steps.length - 1 ? onClose() : setIndex(index + 1)
            }
          >
            {index === steps.length - 1 ? "Aan de slag" : "Volgende stap"}
            <ArrowRight size={16} />
          </button>
        </footer>
      </section>
    </div>
  );
}
