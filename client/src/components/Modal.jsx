import { useEffect } from "react";

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="Fermer">
              ✕
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function RulesModal({ game, onClose }) {
  return (
    <Modal title={`Règles — ${game.name}`} onClose={onClose}>
      <ol className="rules">
        {game.rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ol>
    </Modal>
  );
}
