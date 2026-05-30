"use client";

import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/utils";
import { Bot, Send, User, BarChart3, Table2, FileText } from "lucide-react";

interface RAGResult { type: "table" | "chart" | "summary"; title: string; summary: string; data: Record<string, unknown>[] }
interface Message { role: "user" | "assistant"; text: string; result?: RAGResult }

const SUGGESTIONS = [
  "Which trucks have required the most maintenance in the last 90 days?",
  "Which driver has the highest number of safety incidents?",
  "Show on-time delivery rate by customer",
  "Compare fuel efficiency across truck models",
  "What are the most profitable routes?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: "user", text: question };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await apiFetch<{ result: RAGResult }>("/api/query", {
        method: "POST",
        body: JSON.stringify({ question }),
      });
      setMessages((m) => [...m, { role: "assistant", text: res.result.summary, result: res.result }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", text: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-800 flex items-center gap-3">
        <Bot className="w-5 h-5 text-violet-400" />
        <div>
          <h1 className="text-sm font-semibold text-white">AI Query Interface</h1>
          <p className="text-xs text-slate-500">Natural Language · Fleet Intelligence</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <p className="text-slate-500 text-sm text-center mb-6">Ask anything about fleet operations, drivers, maintenance, or delivery performance.</p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-left px-4 py-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 max-w-4xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-violet-600" : "bg-slate-700"}`}>
              {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-slate-300" />}
            </div>
            <div className="flex-1">
              {msg.role === "user" ? (
                <div className="bg-violet-600/20 border border-violet-500/20 rounded-xl px-4 py-3 text-slate-200 text-sm">{msg.text}</div>
              ) : (
                <div className="space-y-3">
                  {msg.result && (
                    <>
                      <div className="flex items-center gap-2">
                        {msg.result.type === "table"   && <Table2 className="w-4 h-4 text-blue-400" />}
                        {msg.result.type === "chart"   && <BarChart3 className="w-4 h-4 text-emerald-400" />}
                        {msg.result.type === "summary" && <FileText className="w-4 h-4 text-violet-400" />}
                        <h3 className="text-white font-semibold text-sm">{msg.result.title}</h3>
                      </div>
                      {msg.result.summary && (
                        <p className="text-slate-400 text-sm leading-relaxed">{msg.result.summary}</p>
                      )}
                      {msg.result.data && msg.result.data.length > 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-slate-800">
                                {Object.keys(msg.result.data[0]).map((k) => (
                                  <th key={k} className="px-3 py-2 text-left text-slate-500 font-semibold uppercase tracking-wider">
                                    {k.replace(/_/g, " ")}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {msg.result.data.slice(0, 20).map((row, ri) => (
                                <tr key={ri} className={`border-b border-slate-800/50 ${ri % 2 === 0 ? "" : "bg-slate-800/20"}`}>
                                  {Object.values(row).map((v, vi) => (
                                    <td key={vi} className="px-3 py-2 text-slate-400">{String(v)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                  {!msg.result && <p className="text-slate-400 text-sm">{msg.text}</p>}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-4xl">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-slate-300" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-8 py-4 border-t border-slate-800">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a logistics question…"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button type="submit" disabled={!input.trim() || loading}
            className="px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
