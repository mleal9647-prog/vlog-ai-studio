import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPTS = {
  script: `Eres un experto creador de contenido de vlogs y lifestyle para redes sociales. Cuando te pidan un guión de video, genera:

1. TÍTULO VIRAL (con gancho emocional)
2. DURACIÓN RECOMENDADA
3. GANCHO DE APERTURA (primeros 3 segundos - crucial para retención)
4. GUIÓN COMPLETO con:
   - Narración hablada natural y conversacional
   - [ACCIÓN: descripción de lo que se ve en pantalla]
   - Transiciones sugeridas
5. SUBTÍTULOS AUTOMÁTICOS: El guión dividido en bloques cortos de 3-5 palabras para subtítulos (formato TikTok/Reels)
6. CALL TO ACTION final
7. HASHTAGS para Instagram, TikTok y Facebook

Tono: auténtico, cercano, aspiracional. Estilo vlog lifestyle moderno.
Responde siempre en español.`,

  caption: `Eres experto en copywriting para redes sociales de vlogs y lifestyle. Crea captions que conecten emocionalmente.
Para cada solicitud genera captions para Instagram, TikTok y Facebook adaptados a cada plataforma.
Instagram: estético, aspiracional, con emojis elegantes.
TikTok: energético, con gancho, referencias a tendencias.
Facebook: conversacional, que invite a comentar.
Incluye hashtags específicos para cada plataforma.
Responde en español.`,

  calendar: `Eres un estratega de contenido para vlogs y lifestyle. Crea calendarios editoriales detallados con:
- Día y fecha
- Plataforma (Instagram/TikTok/Facebook)
- Tipo de contenido (Reel, Story, TikTok, Post, Live)
- Tema del video/post
- Mejor hora para publicar
- Objetivo (alcance/engagement/conversión)
Formato visual y organizado. Responde en español.`,

  trends: `Eres un analista de tendencias para creadores de vlogs y lifestyle. Analiza y proporciona:
- Tendencias actuales en TikTok, Instagram Reels y Facebook
- Audios/sonidos virales recomendados
- Formatos de video que están funcionando
- Hashtags en tendencia por plataforma
- Ideas de contenido basadas en tendencias
- Consejos para el algoritmo de cada plataforma
Responde en español con emojis y formato claro.`,

  subtitles: `Eres experto en subtítulos para videos de vlogs y lifestyle. Cuando recibas un texto o guión:
1. Divide el texto en bloques de 3-5 palabras máximo (estilo TikTok/Reels)
2. Numera cada bloque con tiempo aproximado (cada bloque ~1.5 segundos)
3. Sugiere palabras CLAVE que deben ir en MAYÚSCULAS para énfasis
4. Indica emojis que pueden aparecer como overlay en momentos clave
5. Sugiere colores de subtítulo recomendados para lifestyle (ej: blanco con sombra negra)
Formato: [00:00] texto del subtítulo
Responde en español.`
};

const tools = [
  { id: "script", icon: "🎬", label: "Guión de Video", color: "#f59e0b", desc: "Guión completo con subtítulos" },
  { id: "caption", icon: "✍️", label: "Captions", color: "#ec4899", desc: "Para las 3 plataformas" },
  { id: "calendar", icon: "📅", label: "Calendario", color: "#10b981", desc: "Plan editorial semanal" },
  { id: "trends", icon: "🔥", label: "Tendencias", color: "#ef4444", desc: "Qué está viral ahora" },
  { id: "subtitles", icon: "💬", label: "Subtítulos", color: "#8b5cf6", desc: "Formato TikTok/Reels" },
];

const platforms = [
  { id: "instagram", icon: "📸", label: "Instagram", color: "#E1306C" },
  { id: "tiktok", icon: "🎵", label: "TikTok", color: "#ff0050" },
  { id: "facebook", icon: "👥", label: "Facebook", color: "#1877F2" },
];

const suggestions = {
  script: ["Un día en mi rutina matutina", "Mi viaje a la playa este fin de semana", "Cómo organizo mi semana productiva", "Mi proceso de skincare completo"],
  caption: ["Foto en café trabajando", "Video de outfit del día", "Momento de relax en casa", "Aventura en la naturaleza"],
  calendar: ["Semana de viajes", "Semana de lifestyle urbano", "Semana de bienestar y salud", "Semana de moda y estilo"],
  trends: ["TikTok esta semana", "Instagram Reels", "Contenido lifestyle viral", "Audios de moda"],
  subtitles: ["Pega aquí tu guión o texto para convertir en subtítulos..."],
};

export default function VlogAIStudio() {
  const [activeTool, setActiveTool] = useState("script");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [activePlatforms, setActivePlatforms] = useState(["instagram", "tiktok", "facebook"]);
  const outputRef = useRef(null);

  useEffect(() => {
    setInput("");
    setOutput("");
  }, [activeTool]);

  useEffect(() => {
    if (output && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output]);

  const togglePlatform = (id) => {
    setActivePlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const generate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setOutput("");

    const platformNote = activePlatforms.length > 0
      ? ` Plataformas: ${activePlatforms.join(", ")}.`
      : "";

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPTS[activeTool],
          messages: [{ role: "user", content: input + platformNote }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Error generando contenido.";
      setOutput(text);
      setHistory(prev => [{ tool: activeTool, input, output: text, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
    } catch {
      setOutput("Hubo un error. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTool = tools.find(t => t.id === activeTool);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      fontFamily: "'DM Sans', sans-serif",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .tool-card { transition: all 0.25s ease; cursor: pointer; }
        .tool-card:hover { transform: translateY(-2px); }
        .generate-btn { transition: all 0.2s ease; cursor: pointer; border: none; }
        .generate-btn:hover:not(:disabled) { transform: scale(1.02); filter: brightness(1.1); }
        .generate-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .suggestion-chip { transition: all 0.2s ease; cursor: pointer; }
        .suggestion-chip:hover { background: rgba(255,255,255,0.12) !important; }
        .copy-btn { transition: all 0.2s ease; cursor: pointer; border: none; }
        .copy-btn:hover { opacity: 0.8; }
        .platform-pill { cursor: pointer; border: none; transition: all 0.2s; }
        .platform-pill:hover { transform: scale(1.05); }
        .output-appear { animation: appear 0.4s ease; }
        @keyframes appear { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        textarea:focus { outline: none; }
        textarea { resize: none; }
        .hist-item { transition: all 0.2s; cursor: pointer; }
        .hist-item:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "18px 28px",
        borderBottom: "1px solid #1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#0a0a0a",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>🎥</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 17, letterSpacing: "-0.3px" }}>
              Vlog AI Studio
            </div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 500 }}>
              Lifestyle Content Creator
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {platforms.map(p => (
            <button
              key={p.id}
              className="platform-pill"
              onClick={() => togglePlatform(p.id)}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                background: activePlatforms.includes(p.id) ? p.color + "22" : "transparent",
                border: `1px solid ${activePlatforms.includes(p.id) ? p.color : "#222"}`,
                color: activePlatforms.includes(p.id) ? p.color : "#444",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{
          width: 200,
          borderRight: "1px solid #1a1a1a",
          padding: "20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          overflowY: "auto",
        }}>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: "2px", fontWeight: 600, textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>
            Herramientas
          </div>
          {tools.map(tool => (
            <div
              key={tool.id}
              className="tool-card"
              onClick={() => setActiveTool(tool.id)}
              style={{
                padding: "12px",
                borderRadius: 12,
                background: activeTool === tool.id ? tool.color + "18" : "transparent",
                border: `1px solid ${activeTool === tool.id ? tool.color + "40" : "transparent"}`,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{tool.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: activeTool === tool.id ? tool.color : "#bbb" }}>{tool.label}</div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{tool.desc}</div>
            </div>
          ))}

          {/* History */}
          {history.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: "2px", fontWeight: 600, textTransform: "uppercase", marginTop: 16, marginBottom: 8, paddingLeft: 8 }}>
                Recientes
              </div>
              {history.map((h, i) => {
                const t = tools.find(x => x.id === h.tool);
                return (
                  <div
                    key={i}
                    className="hist-item"
                    onClick={() => { setActiveTool(h.tool); setInput(h.input); setOutput(h.output); }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ fontSize: 11, color: t?.color, fontWeight: 600 }}>{t?.icon} {t?.label}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.input}</div>
                    <div style={{ fontSize: 9, color: "#333", marginTop: 2 }}>{h.time}</div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", padding: "24px 28px" }}>
          {/* Tool header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 28 }}>{currentTool?.icon}</span>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22 }}>{currentTool?.label}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{currentTool?.desc} · Vlogs & Lifestyle</div>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {(suggestions[activeTool] || []).map((s, i) => (
              <span
                key={i}
                className="suggestion-chip"
                onClick={() => setInput(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid #222",
                  fontSize: 12,
                  color: "#888",
                }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Input */}
          <div style={{
            background: "#111",
            border: `1px solid ${loading ? currentTool?.color + "60" : "#222"}`,
            borderRadius: 16,
            padding: "16px",
            marginBottom: 16,
            transition: "border-color 0.3s",
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && e.metaKey) generate(); }}
              placeholder={
                activeTool === "script" ? "Describe tu video... ej: 'Un día en mi rutina matutina de lunes'" :
                activeTool === "caption" ? "¿De qué es el post? ej: 'Foto trabajando en un café en Barcelona'" :
                activeTool === "calendar" ? "¿Cuál es el tema de esta semana? ej: 'Semana de viajes y aventuras'" :
                activeTool === "trends" ? "¿Qué nicho o tema quieres analizar? ej: 'lifestyle femenino'" :
                "Pega aquí el texto o guión para convertir en subtítulos..."
              }
              rows={4}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#e0e0e0",
                fontSize: 14,
                fontFamily: "inherit",
                lineHeight: 1.6,
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span style={{ fontSize: 11, color: "#444" }}>⌘ + Enter para generar</span>
              <button
                className="generate-btn"
                onClick={generate}
                disabled={loading || !input.trim()}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${currentTool?.color}, ${currentTool?.color}aa)`,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <><span className="pulse">⚡</span> Generando...</>
                ) : (
                  <>{currentTool?.icon} Generar</>
                )}
              </button>
            </div>
          </div>

          {/* Output */}
          {output && (
            <div ref={outputRef} className="output-appear" style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: 16,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "12px 16px",
                borderBottom: "1px solid #1a1a1a",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#0d0d0d",
              }}>
                <div style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>
                  {currentTool?.icon} Resultado generado
                </div>
                <button
                  className="copy-btn"
                  onClick={copyOutput}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 8,
                    background: copied ? "#10b981" : "rgba(255,255,255,0.08)",
                    color: copied ? "#fff" : "#888",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "inherit",
                  }}
                >
                  {copied ? "✅ Copiado" : "📋 Copiar"}
                </button>
              </div>
              <div style={{
                padding: "20px",
                fontSize: 13,
                lineHeight: 1.8,
                color: "#ccc",
                whiteSpace: "pre-wrap",
                maxHeight: 500,
                overflowY: "auto",
              }}>
                {output}
              </div>
            </div>
          )}

          {!output && !loading && (
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
              color: "#333",
              padding: "40px 0",
            }}>
              <div style={{ fontSize: 48 }}>🎬</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#444" }}>Tu contenido aparecerá aquí</div>
              <div style={{ fontSize: 12, color: "#333" }}>Escribe un tema y presiona Generar</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
