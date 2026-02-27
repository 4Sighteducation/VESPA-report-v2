import { useState } from "react";

const BLUE = "#1B4F8A";
const ORANGE = "#E87722";
const LIGHT = "#E8F0FB";
const DARK = "#0D2B4E";

const tabs = ["Conversation Flow", "Live Example", "System Prompt", "Backend Architecture"];

// ─── FLOW MAP ───────────────────────────────────────────────────────────────

const flowNodes = [
  {
    id: "entry", x: 50, y: 4, w: 200, label: "Student enters UniGuide",
    sub: "First time or returning", color: BLUE, text: "white"
  },
  {
    id: "choice", x: 50, y: 16, w: 200, label: "Choose your path",
    sub: null, color: DARK, text: "white", isDecision: true
  },
];

function FlowMap() {
  const [hovered, setHovered] = useState(null);

  const stages = [
    {
      label: "ENTRY POINT",
      color: BLUE,
      node: { title: "Student arrives at UniGuide", sub: "Integrated into VESPA dashboard — grades & subject already known" }
    },
    {
      label: "PATH SPLIT",
      color: "#6B4FAE",
      isDecision: true,
      left: { title: "💬  AI Advisor Chat", sub: "Undecided or wants to explore — takes 5–8 minutes" },
      right: { title: "🔍  Quick Filter Search", sub: "Student knows what they want — instant results" }
    },
    {
      label: "AI CONVERSATION",
      color: ORANGE,
      onlyLeft: true,
      node: {
        title: "5-phase guided conversation",
        bullets: [
          "① Opening — what have you enjoyed most?",
          "② Probing — follow threads, find the real interest",
          "③ Practicalities — location, debt attitude, career direction",
          "④ Constraints — subject requirements, first in family?",
          "⑤ Summary check — AI plays back what it heard"
        ]
      }
    },
    {
      label: "PROFILE EXTRACTION",
      color: "#2A8A5A",
      onlyLeft: true,
      node: {
        title: "AI outputs structured JSON (hidden from student)",
        bullets: [
          "subject_codes: ['L3', 'C8']  ← Psychology, Forensic Sci",
          "tariff_estimate: 128",
          "location_pref: 'North West'",
          "aspiration_level: 'balanced'",
          "flags: ['first_gen', 'career_unclear']"
        ],
        isCode: true
      }
    },
    {
      label: "RESULTS MERGE",
      color: BLUE,
      node: {
        title: "Discover Uni dataset query",
        sub: "JSON profile hits PostgreSQL → returns banded course list",
        bullets: [
          "🎯  Aspirational matches  (stretch courses)",
          "✅  Solid matches  (well within range)",
          "🛡️  Safer matches  (comfortable entry)"
        ]
      }
    },
    {
      label: "OUTPUT",
      color: "#1B7A4A",
      node: {
        title: "Personalised course list — with AI reasoning",
        sub: "Each card shows WHY it was suggested based on the conversation",
        bullets: [
          "Save to shortlist → feeds UCAS application tool",
          "Share with teacher / advisor",
          "Restart conversation to refine"
        ]
      }
    }
  ];

  return (
    <div style={{ fontFamily: "'Georgia', serif", padding: "0 8px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: ORANGE, textTransform: "uppercase", marginBottom: 6 }}>Architecture Overview</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: DARK }}>How the AI Advisor Conversation Works</div>
        <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>From student arrival to personalised course shortlist</div>
      </div>

      <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
        {stages.map((stage, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            {/* Stage label */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 6
            }}>
              <div style={{
                background: stage.color, color: "white", fontSize: 9, fontFamily: "monospace",
                letterSpacing: 2, padding: "3px 10px", borderRadius: 2, whiteSpace: "nowrap"
              }}>
                {i + 1}  {stage.label}
              </div>
              <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
            </div>

            {stage.isDecision ? (
              <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
                {[stage.left, stage.right].map((side, si) => (
                  <div key={si} onMouseEnter={() => setHovered(`${i}-${si}`)} onMouseLeave={() => setHovered(null)}
                    style={{
                      flex: 1, border: `2px solid ${hovered === `${i}-${si}` ? ORANGE : stage.color}`,
                      borderRadius: 10, padding: "14px 16px",
                      background: hovered === `${i}-${si}` ? "#FFF8F0" : "white",
                      transition: "all 0.2s", cursor: "default"
                    }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 4 }}>{side.title}</div>
                    <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{side.sub}</div>
                    <div style={{
                      marginTop: 8, fontSize: 11, padding: "4px 10px", borderRadius: 20,
                      background: si === 0 ? "#FFF3E8" : "#EBF5FF",
                      color: si === 0 ? ORANGE : BLUE, display: "inline-block", fontWeight: 600
                    }}>
                      {si === 0 ? "→ AI conversation path" : "→ Filter path (unchanged)"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                style={{
                  border: `2px solid ${hovered === i ? ORANGE : "#e0e0e0"}`,
                  borderLeft: `5px solid ${stage.color}`,
                  borderRadius: 10, padding: "14px 18px",
                  background: hovered === i ? "#FAFCFF" : "white",
                  transition: "all 0.2s", cursor: "default",
                  marginLeft: stage.onlyLeft ? 0 : 0
                }}>
                {stage.onlyLeft && (
                  <div style={{
                    fontSize: 10, color: ORANGE, letterSpacing: 1.5,
                    textTransform: "uppercase", marginBottom: 6, fontFamily: "monospace"
                  }}>AI ADVISOR PATH ONLY ↓</div>
                )}
                <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 4 }}>
                  {stage.node.title}
                </div>
                {stage.node.sub && (
                  <div style={{ fontSize: 12, color: "#666", marginBottom: stage.node.bullets ? 10 : 0 }}>
                    {stage.node.sub}
                  </div>
                )}
                {stage.node.bullets && (
                  <div style={{
                    background: stage.node.isCode ? "#0D1117" : "#F8F9FB",
                    borderRadius: 6, padding: "10px 14px", marginTop: 6
                  }}>
                    {stage.node.bullets.map((b, bi) => (
                      <div key={bi} style={{
                        fontSize: 12, fontFamily: stage.node.isCode ? "monospace" : "inherit",
                        color: stage.node.isCode ? "#7DD3FC" : "#444",
                        lineHeight: 1.8, padding: "1px 0"
                      }}>{b}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {i < stages.length - 1 && (
              <div style={{ textAlign: "center", margin: "4px 0", fontSize: 18, color: "#ccc" }}>↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LIVE EXAMPLE ────────────────────────────────────────────────────────────

const conversation = [
  {
    role: "ai",
    msg: "Hi! I'm here to help you find courses and universities that actually suit you — not just what looks good on paper. This usually takes about 5 minutes and it's just a conversation, so there are no right answers.\n\nLet's start somewhere easy: what's been the most interesting thing you've studied in the last year or two? Doesn't have to be your best subject — just the one that made you think.",
    phase: "① Opening"
  },
  {
    role: "student",
    msg: "Probably the unit we did on crime and punishment in sociology. I found it really interesting why people commit crimes and how the justice system deals with it differently depending on where you are."
  },
  {
    role: "ai",
    msg: "That's a really specific interest — the gap between why crime happens and how society responds to it. That's actually the heart of a few different degree subjects.\n\nWhen you say you found it interesting — was it more the psychological side (what's going on in someone's head), the social patterns (why some communities have higher crime rates), or the legal and justice system side of things?",
    phase: "② Probing"
  },
  {
    role: "student",
    msg: "Definitely more the psychology side. Like why do people make those choices. But I also found the legal stuff interesting when we looked at how different countries sentence people differently."
  },
  {
    role: "ai",
    msg: "Really useful — you're sitting at an interesting crossroads between Psychology and Criminology. Some people in your position end up loving a joint honours that covers both.\n\nQuick practical question: are you thinking about staying close to home or are you open to going further afield? And do you have a rough sense of your predicted grades?",
    phase: "③ Practicalities"
  },
  {
    role: "student",
    msg: "I'd prefer to stay in the North West if possible. My mum wants me to stay closer. I'm predicted ABB."
  },
  {
    role: "ai",
    msg: "ABB is a solid set of grades — that opens up a really good range of universities for you. With a preference for the North West you've got some strong options: Manchester, Manchester Met, Liverpool, Lancaster, Edge Hill, Salford.\n\nOne more thing — when you think about where you want to be at 25, is there a career direction pulling at you, or is it more that you want to understand the subject first and see where it leads?",
    phase: "④ Constraints"
  },
  {
    role: "student",
    msg: "Probably understand it first. Maybe something like a probation officer or working in the prison system but I'm not 100% sure."
  },
  {
    role: "ai",
    msg: "Perfect — that's really helpful. Let me play back what I've heard before we look at courses:\n\n🎓  You're drawn to the psychology of criminal behaviour and comparative justice systems\n📍  Preference for North West universities\n📊  Predicted ABB\n🧭  Career direction leaning toward probation / criminal justice work, but open to exploring\n\nDoes that feel accurate? Anything you'd want to add or change?",
    phase: "⑤ Summary"
  },
  {
    role: "student",
    msg: "Yes that's pretty much it!"
  },
  {
    role: "ai",
    msg: "Great — I'm pulling your course matches now. You'll see them banded into Aspirational, Solid, and Safer options. Each one will show you why it came up based on our conversation.",
    phase: "→ Results",
    isLast: true
  }
];

const phaseColors = {
  "① Opening": "#2A8A5A",
  "② Probing": BLUE,
  "③ Practicalities": "#6B4FAE",
  "④ Constraints": ORANGE,
  "⑤ Summary": "#C0392B",
  "→ Results": "#1B7A4A"
};

function LiveExample() {
  const [shown, setShown] = useState(1);

  return (
    <div style={{ fontFamily: "'Georgia', serif" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: ORANGE, textTransform: "uppercase", marginBottom: 6 }}>Exemplar Conversation</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: DARK }}>The AI Advisor in Action</div>
        <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Student interested in sociology / psychology — predicted ABB — North West preference</div>
      </div>

      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        {conversation.slice(0, shown).map((msg, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: msg.role === "student" ? "row-reverse" : "row",
            gap: 10, marginBottom: 16, alignItems: "flex-start"
          }}>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: msg.role === "ai" ? BLUE : "#e8e8e8",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: msg.role === "ai" ? "white" : "#555"
            }}>
              {msg.role === "ai" ? "✦" : "S"}
            </div>

            <div style={{ maxWidth: "80%" }}>
              {/* Phase badge */}
              {msg.phase && (
                <div style={{
                  fontSize: 10, fontFamily: "monospace", letterSpacing: 1.5,
                  textTransform: "uppercase", color: phaseColors[msg.phase] || BLUE,
                  marginBottom: 4, paddingLeft: 2
                }}>
                  PHASE {msg.phase}
                </div>
              )}

              {/* Bubble */}
              <div style={{
                background: msg.role === "ai" ? LIGHT : "#F0F0F0",
                borderRadius: msg.role === "ai" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                padding: "12px 16px",
                border: msg.role === "ai" ? `1px solid #C5D9F2` : "1px solid #e0e0e0"
              }}>
                {msg.msg.split("\n\n").map((para, pi) => (
                  <p key={pi} style={{
                    margin: pi === 0 ? 0 : "8px 0 0",
                    fontSize: 13.5, lineHeight: 1.65,
                    color: msg.role === "ai" ? DARK : "#333"
                  }}>{para}</p>
                ))}
              </div>

              {msg.isLast && shown >= conversation.length && (
                <div style={{
                  marginTop: 10, padding: "12px 16px", borderRadius: 10,
                  background: "#F0FFF4", border: `2px solid #2A8A5A`
                }}>
                  <div style={{ fontSize: 12, color: "#2A8A5A", fontWeight: 700, marginBottom: 6 }}>→ JSON profile extracted (hidden from student)</div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#1a5c3a", lineHeight: 1.8 }}>
                    {`{
  "subject_codes": ["L3", "C8", "M1"],
  "subjects": ["Criminology", "Psychology", "Law"],
  "tariff_estimate": 128,
  "location": "North West",
  "aspiration": "balanced",
  "career_flags": ["probation", "criminal_justice"],
  "flags": ["location_constrained"]
}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {shown < conversation.length ? (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={() => setShown(s => s + 1)} style={{
              background: BLUE, color: "white", border: "none",
              borderRadius: 20, padding: "9px 24px", cursor: "pointer",
              fontSize: 13, fontFamily: "'Georgia', serif"
            }}>
              Show next message ↓
            </button>
            <div style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
              {shown} of {conversation.length} messages shown
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: "center", marginTop: 16, padding: "14px",
            background: "#FFF8F0", borderRadius: 10, border: `2px solid ${ORANGE}`
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: ORANGE }}>Conversation complete</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              JSON profile now queries the Discover Uni dataset → banded results returned
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────

const promptSections = [
  {
    label: "ROLE & PERSONA",
    color: BLUE,
    content: `You are an AI university advisor for UniGuide, built by VESPA Academy. Your role is to have a warm, curious conversation with a sixth-form student to understand what they genuinely want from university — and then surface course matches from our database.

You are NOT a chatbot running through a form. You are a knowledgeable, experienced advisor having a real conversation. You follow threads that interest you, ask follow-up questions, and respond genuinely to what students say.

Your tone is: warm, interested, slightly informal, never condescending. You treat the student as intelligent. You never use corporate language or edu-speak.`
  },
  {
    label: "CONVERSATION STRUCTURE",
    color: ORANGE,
    content: `Guide the conversation through five natural phases. Do not announce the phases — just move through them naturally.

PHASE 1 — OPENING (1–2 exchanges)
Ask what they've found most interesting to study. Stress there are no right answers. Do not ask about grades yet.

PHASE 2 — PROBING (2–4 exchanges)
Follow the thread. Ask WHY they find it interesting. Look for the underlying pull — is it analytical? creative? human? systemic? Probe until you can distinguish between subjects that look similar on the surface (e.g. Psychology vs Sociology vs Criminology).

PHASE 3 — PRACTICALITIES (1–2 exchanges)
Location preference. Grades (if not already mentioned). Attitude toward debt / distance from home. First in family to university? These are practical constraints, not judgements.

PHASE 4 — CAREER DIRECTION (1 exchange)
Do they have a direction? Or do they want to explore the subject first? Both are completely valid — capture which it is.

PHASE 5 — SUMMARY CHECK
Play back what you've heard in a clear summary using bullet points or short sentences. Ask the student to confirm or correct. Only proceed to results when confirmed.`
  },
  {
    label: "RULES & GUARDRAILS",
    color: "#2A8A5A",
    content: `NEVER ask more than one question per message.
NEVER ask for grades in your first message.
NEVER suggest specific universities or courses during the conversation — save that for the results.
NEVER use filler phrases like "Great question!" or "Absolutely!".
DO reflect back what the student says before asking your next question — this signals that you heard them.
DO follow unexpected threads — if a student mentions something surprising, explore it.
DO acknowledge when students are uncertain. Uncertainty is useful information.
IF a student is clearly decided (e.g. "I want to do Computer Science at Manchester"), acknowledge it, ask one clarifying question, then move to results quickly. Don't force a longer conversation.`
  },
  {
    label: "JSON OUTPUT (after summary confirmed)",
    color: "#6B4FAE",
    content: `When the student confirms the summary, output the following JSON block. This is NOT shown to the student — it is parsed by the backend to query the course database.

{
  "subject_codes": [],          // JACS/HECoS codes, up to 4
  "subject_labels": [],         // Human-readable subject names
  "tariff_estimate": 0,         // Numeric UCAS points estimate
  "tariff_confidence": "",      // "confirmed" | "estimated" | "unknown"
  "location_pref": "",          // Region name or "anywhere"
  "location_strict": false,     // true if student explicitly said must stay local
  "aspiration_level": "",       // "aspirational" | "balanced" | "safe"
  "career_flags": [],           // e.g. ["medicine", "law", "teaching"]
  "student_flags": [],          // e.g. ["first_gen", "location_constrained", "career_unclear"]
  "conversation_summary": ""    // 2–3 sentence plain English summary for teacher view
}

Then output a SHORT message to the student confirming results are loading.`
  }
];

function SystemPrompt() {
  const [open, setOpen] = useState(0);
  const [copied, setCopied] = useState(false);

  const fullPrompt = promptSections.map(s => `## ${s.label}\n\n${s.content}`).join("\n\n---\n\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: "'Georgia', serif" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: ORANGE, textTransform: "uppercase", marginBottom: 6 }}>Backend Design</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: DARK }}>The System Prompt</div>
        <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Paste this into your Claude API call as the <code>system</code> parameter</div>
      </div>

      <div style={{ maxWidth: 660, margin: "0 auto" }}>
        {promptSections.map((section, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <button onClick={() => setOpen(open === i ? -1 : i)} style={{
              width: "100%", textAlign: "left", padding: "12px 16px",
              background: open === i ? section.color : "white",
              color: open === i ? "white" : DARK,
              border: `2px solid ${section.color}`, borderRadius: open === i ? "10px 10px 0 0" : 10,
              cursor: "pointer", display: "flex", justifyContent: "space-between",
              alignItems: "center", fontSize: 13, fontWeight: 700,
              fontFamily: "'Georgia', serif", transition: "all 0.15s"
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 1 }}>
                {i + 1 < 10 ? `0${i+1}` : i+1}  {section.label}
              </span>
              <span style={{ fontSize: 16 }}>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && (
              <div style={{
                border: `2px solid ${section.color}`, borderTop: "none",
                borderRadius: "0 0 10px 10px", padding: "16px 18px",
                background: "#FAFBFF"
              }}>
                <pre style={{
                  margin: 0, fontSize: 12, lineHeight: 1.75, fontFamily: "monospace",
                  color: "#1a1a2e", whiteSpace: "pre-wrap", wordBreak: "break-word"
                }}>
                  {section.content}
                </pre>
              </div>
            )}
          </div>
        ))}

        <div style={{ textAlign: "right", marginTop: 16 }}>
          <button onClick={handleCopy} style={{
            background: copied ? "#2A8A5A" : DARK, color: "white",
            border: "none", borderRadius: 8, padding: "9px 20px",
            cursor: "pointer", fontSize: 13, fontFamily: "'Georgia', serif",
            transition: "background 0.2s"
          }}>
            {copied ? "✓ Copied to clipboard" : "Copy full prompt"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BACKEND ARCHITECTURE ────────────────────────────────────────────────────

const archSteps = [
  {
    num: "01", label: "Vue.js Chat Component",
    color: "#42A5C8",
    detail: "ChatAdvisor.vue — manages message history array, renders conversation UI, handles streaming responses. On each student message, appends to history and calls the API endpoint.",
    code: `// Each turn appends to history
const history = [
  { role: "user", content: studentMessage }
]
await fetch('/api/advisor', {
  method: 'POST',
  body: JSON.stringify({ history, studentProfile })
})`
  },
  {
    num: "02", label: "Node.js Proxy Endpoint",
    color: BLUE,
    detail: "POST /api/advisor — sits between Vue and the Claude API. Injects the system prompt, prepends known student context (grades, subjects from UCAS tool), and streams the response back to the frontend.",
    code: `// server/routes/advisor.js
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 600,
  system: UNIGUIDE_SYSTEM_PROMPT,
  messages: [
    { role: "user", content: studentContext },
    ...conversationHistory
  ],
  stream: true
})`
  },
  {
    num: "03", label: "Student Context Injection",
    color: "#6B4FAE",
    detail: "Before the conversation starts, the backend prepends a silent context message with data already known from the UCAS tool. This means the AI never needs to ask for grades if they're already captured.",
    code: `const studentContext = \`
[STUDENT CONTEXT — do not reveal this to student]
Name: \${student.firstName}
Predicted grades: \${student.predictedGrades}
A-Level subjects: \${student.subjects.join(', ')}
Personal statement subject area: \${student.psSubject}
Use this to skip questions already answered.
\``
  },
  {
    num: "04", label: "JSON Detection & Parsing",
    color: "#2A8A5A",
    detail: "After each AI response, the backend scans for the JSON output block. When detected, the conversation is marked complete and the profile is extracted.",
    code: `// Detect when AI has output the profile JSON
const jsonMatch = aiResponse.match(/\\{[\\s\\S]*"subject_codes"[\\s\\S]*\\}/)
if (jsonMatch) {
  const profile = JSON.parse(jsonMatch[0])
  await queryCourseDatabase(profile)
  // Don't show JSON to student — show results instead
}`
  },
  {
    num: "05", label: "Course Database Query",
    color: ORANGE,
    detail: "The extracted JSON profile queries PostgreSQL. Subject codes hit the courses table, tariff estimate drives the Aspirational/Solid/Safer banding, location filters by region. Results are returned ranked by NSS score within each band.",
    code: `SELECT c.*, i.name as institution_name,
  CASE 
    WHEN c.tariff_typical > :tariff + 24 THEN 'aspirational'
    WHEN c.tariff_typical < :tariff - 24 THEN 'safer'
    ELSE 'solid'
  END as band
FROM courses c
JOIN institutions i ON c.institution_id = i.id
WHERE c.subject_code = ANY(:subject_codes)
  AND i.region = :location
ORDER BY band, c.nss_score DESC`
  },
  {
    num: "06", label: "Results with AI Reasoning",
    color: "#C0392B",
    detail: "Each course card includes a one-line AI-generated reason based on the conversation. A final lightweight Claude call generates these reasons using the conversation summary. This is what makes results feel personal rather than algorithmic.",
    code: `// Per-course reasoning (single API call for all results)
"Based on your interest in the psychology of criminal 
behaviour and your goal of working in the justice system, 
[Course] at [University] covers forensic psychology 
modules from year one and has strong links with 
probation services in the North West."`
  }
];

function BackendArch() {
  const [open, setOpen] = useState(null);

  return (
    <div style={{ fontFamily: "'Georgia', serif" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: ORANGE, textTransform: "uppercase", marginBottom: 6 }}>Technical Design</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: DARK }}>Backend Architecture</div>
        <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Click each step for implementation detail and sample code</div>
      </div>

      <div style={{ maxWidth: 660, margin: "0 auto" }}>
        {archSteps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 0, marginBottom: 0 }}>
            {/* Connector line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 48, flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: step.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 11, fontWeight: 700, fontFamily: "monospace",
                flexShrink: 0, zIndex: 1
              }}>{step.num}</div>
              {i < archSteps.length - 1 && (
                <div style={{ width: 2, flex: 1, background: "#e0e0e0", minHeight: 12 }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: 12, paddingLeft: 12 }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{
                width: "100%", textAlign: "left", background: "white",
                border: `2px solid ${open === i ? step.color : "#e0e0e0"}`,
                borderRadius: 8, padding: "10px 14px", cursor: "pointer",
                fontFamily: "'Georgia', serif", transition: "border-color 0.15s"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{step.label}</span>
                  <span style={{ fontSize: 12, color: "#999" }}>{open === i ? "collapse −" : "expand +"}</span>
                </div>
              </button>

              {open === i && (
                <div style={{
                  border: `2px solid ${step.color}`, borderTop: "none",
                  borderRadius: "0 0 8px 8px", padding: "14px 16px",
                  marginTop: -2, background: "#FAFBFF"
                }}>
                  <p style={{ fontSize: 13, color: "#444", lineHeight: 1.65, marginTop: 0, marginBottom: 12 }}>
                    {step.detail}
                  </p>
                  <pre style={{
                    background: "#0D1117", borderRadius: 6, padding: "12px 14px",
                    margin: 0, fontSize: 11.5, lineHeight: 1.7, color: "#7DD3FC",
                    overflowX: "auto", whiteSpace: "pre-wrap", fontFamily: "monospace"
                  }}>
                    {step.code}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}

        <div style={{
          marginTop: 16, padding: "14px 18px", borderRadius: 10,
          background: LIGHT, border: `2px solid ${BLUE}`
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 6 }}>💡  Key design decisions</div>
          {[
            "Stream the AI response — don't wait for the full message. Streaming makes the conversation feel alive.",
            "Keep the system prompt on the server, never exposed to the frontend.",
            "The per-course AI reasoning (step 6) is a single batched API call — not one call per course.",
            "Cache conversation summaries in the database so teachers can review them later."
          ].map((note, i) => (
            <div key={i} style={{ fontSize: 12, color: "#444", lineHeight: 1.7, paddingLeft: 12, borderLeft: `3px solid ${ORANGE}`, marginBottom: i < 3 ? 8 : 0 }}>
              {note}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function UniGuideFlow() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F7F9FC",
      fontFamily: "'Georgia', serif"
    }}>
      {/* Header */}
      <div style={{
        background: DARK,
        padding: "20px 24px 0",
        borderBottom: `4px solid ${ORANGE}`
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: -0.5 }}>UniGuide</span>
            <span style={{ fontSize: 12, color: ORANGE, letterSpacing: 2, textTransform: "uppercase" }}>AI Advisor Design</span>
          </div>
          <div style={{ fontSize: 12, color: "#8AA4C8", marginBottom: 16 }}>
            Conversation flow · Exemplar · System prompt · Backend architecture
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0 }}>
            {tabs.map((tab, i) => (
              <button key={i} onClick={() => setActiveTab(i)} style={{
                padding: "9px 16px",
                background: activeTab === i ? "#F7F9FC" : "transparent",
                color: activeTab === i ? DARK : "#8AA4C8",
                border: "none", borderRadius: "6px 6px 0 0",
                cursor: "pointer", fontSize: 12.5, fontWeight: activeTab === i ? 700 : 400,
                fontFamily: "'Georgia', serif", transition: "all 0.15s",
                marginRight: 2
              }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px" }}>
        {activeTab === 0 && <FlowMap />}
        {activeTab === 1 && <LiveExample />}
        {activeTab === 2 && <SystemPrompt />}
        {activeTab === 3 && <BackendArch />}
      </div>
    </div>
  );
}
