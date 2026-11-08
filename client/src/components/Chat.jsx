import { useEffect, useRef, useState } from "react";
import { useSession } from "../lib/session.jsx";

export default function Chat({ code, messages }) {
  const { emit, user } = useSession();
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await emit("chat:send", { code, text });
    if (!res.error) setText("");
  };

  return (
    <section className="panel chat">
      <h3 className="panel-title">Discussion</h3>
      <ul className="chat-list" ref={listRef}>
        {messages.map((m, i) =>
          m.system ? (
            <li key={i} className="chat-system">
              {m.text}
            </li>
          ) : (
            <li key={i} className={m.author === user?.username ? "chat-mine" : ""}>
              <strong>{m.author}</strong> {m.text}
            </li>
          )
        )}
      </ul>
      <form className="chat-form" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message…"
          maxLength={300}
          aria-label="Message"
        />
        <button className="btn btn-primary btn-sm" type="submit">
          Envoyer
        </button>
      </form>
    </section>
  );
}
