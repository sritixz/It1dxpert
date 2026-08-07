import { useState, useRef, useEffect } from "react";
import { 
  Send, Bot, User, Sparkles, Loader2, Calendar, 
  Droplet, Syringe, MessageSquare, AlertCircle, RefreshCw 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { chatWithAiAgent } from "../../api/ai.api.js";
import { useAuth } from "../../context/AuthContext.jsx";

export function AiAgentPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Suggestions for the chatbot
  const SUGGESTIONS = [
    {
      text: "Summarize my glucose log today",
      label: "Glucose Log Summary",
      icon: Droplet,
      color: "text-primary bg-primary-light"
    },
    {
      text: "List my insulin doses from the last 7 days",
      label: "Recent Insulin Doses",
      icon: Syringe,
      color: "text-critical bg-critical-light"
    },
    {
      text: "When is my next appointment?",
      label: "Upcoming Appointments",
      icon: Calendar,
      color: "text-success bg-success-light"
    },
    {
      text: "What are some general tips to avoid nocturnal hypoglycemia?",
      label: "Hypoglycemia Tips",
      icon: Sparkles,
      color: "text-warning bg-warning-light"
    }
  ];

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) setInputText("");
    setError("");
    setIsSending(true);

    // Add user message to UI
    const newUserMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, newUserMsg]);

    try {
      // Build history formatting for backend (exclude the new message)
      // Backend expects role: "user" | "model"
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await chatWithAiAgent(text, history);

      // Add model response
      setMessages((prev) => [...prev, { role: "model", content: response }]);
    } catch (err) {
      console.error("CareAI error:", err);
      setError("Failed to get response from CareAI. Please check your internet connection and API key.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear your chat history?")) {
      setMessages([]);
      setError("");
    }
  };

  // Custom rendering for Gemini Markdown output
  function parseInlineCode(text) {
    const codeParts = text.split("`");
    const elements = [];
    let key = 0;
    for (let i = 0; i < codeParts.length; i++) {
      const chunk = codeParts[i];
      if (i % 2 === 1) {
        elements.push(
          <code key={key++} className="px-1.5 py-0.5 rounded bg-bg text-xs font-mono font-semibold border border-border/80">
            {chunk}
          </code>
        );
      } else {
        elements.push(chunk);
      }
    }
    return elements;
  }

  function parseInlineFormatting(text) {
    const elements = [];
    let key = 0;
    const boldParts = text.split("**");
    for (let i = 0; i < boldParts.length; i++) {
      const chunk = boldParts[i];
      if (i % 2 === 1) {
        elements.push(<strong key={key++} className="font-bold text-ink">{parseInlineCode(chunk)}</strong>);
      } else {
        elements.push(<span key={key++}>{parseInlineCode(chunk)}</span>);
      }
    }
    return elements;
  }

  function formatMessageText(text) {
    if (!text) return "";
    const lines = text.split("\n");
    let inList = false;
    let listItems = [];
    const elements = [];
    let elementKey = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle Markdown Alerts
      if (line.startsWith("> [!WARNING]")) {
        let warningText = "";
        i++;
        while (i < lines.length && lines[i].startsWith(">")) {
          warningText += lines[i].slice(1).trim() + " ";
          i++;
        }
        elements.push(
          <div key={`warn-${elementKey++}`} className="my-3 p-3 rounded-xl border border-warning/30 bg-warning-light text-warning text-xs font-body shadow-xs">
            <strong>Warning:</strong> {parseInlineFormatting(warningText.trim())}
          </div>
        );
        continue;
      }

      if (line.startsWith("> [!IMPORTANT]") || line.startsWith("> [!NOTE]")) {
        const isNote = line.startsWith("> [!NOTE]");
        let importantText = "";
        i++;
        while (i < lines.length && lines[i].startsWith(">")) {
          importantText += lines[i].slice(1).trim() + " ";
          i++;
        }
        elements.push(
          <div key={`imp-${elementKey++}`} className={`my-3 p-3 rounded-xl border ${isNote ? "border-primary/20 bg-primary-light text-primary" : "border-primary/30 bg-primary-light text-primary"} text-xs font-body shadow-xs`}>
            <strong>{isNote ? "Note:" : "Important:"}</strong> {parseInlineFormatting(importantText.trim())}
          </div>
        );
        continue;
      }

      // Handle Bullet Points
      if (line.startsWith("* ") || line.startsWith("- ")) {
        inList = true;
        listItems.push(line.slice(2));
        continue;
      } else {
        if (inList) {
          elements.push(
            <ul key={`list-${elementKey++}`} className="list-disc pl-5 my-2 space-y-1 text-sm text-ink font-body">
              {listItems.map((item, idx) => (
                <li key={idx}>{parseInlineFormatting(item)}</li>
              ))}
            </ul>
          );
          inList = false;
          listItems = [];
        }
      }

      // Handle Headers
      if (line.startsWith("### ")) {
        elements.push(<h4 key={`h4-${elementKey++}`} className="text-sm font-bold text-ink mt-3 mb-1.5 font-display">{parseInlineFormatting(line.slice(4))}</h4>);
      } else if (line.startsWith("## ")) {
        elements.push(<h3 key={`h3-${elementKey++}`} className="text-base font-bold text-ink mt-4 mb-2 font-display">{parseInlineFormatting(line.slice(3))}</h3>);
      } else if (line.startsWith("# ")) {
        elements.push(<h2 key={`h2-${elementKey++}`} className="text-lg font-bold text-ink mt-5 mb-2.5 font-display">{parseInlineFormatting(line.slice(2))}</h2>);
      } else if (line.trim() === "") {
        continue;
      } else {
        elements.push(<p key={`p-${elementKey++}`} className="text-sm text-ink leading-relaxed my-2 font-body">{parseInlineFormatting(line)}</p>);
      }
    }

    if (inList) {
      elements.push(
        <ul key={`list-end-${elementKey++}`} className="list-disc pl-5 my-2 space-y-1 text-sm text-ink font-body">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInlineFormatting(item)}</li>
          ))}
        </ul>
      );
    }

    return elements;
  }

  const patientName = user?.patientProfile?.fullName ? user.patientProfile.fullName.split(" ")[0] : "there";

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto gap-4">
      
      {/* Disclaimer Banner */}
      <div className="flex items-center gap-2 p-3 bg-primary-light border border-primary/20 rounded-xl">
        <AlertCircle size={16} className="text-primary flex-shrink-0" />
        <p className="font-body text-xs text-primary leading-snug">
          <strong>Medical Disclaimer:</strong> CareAI is a data assistant to aid understanding. It does not provide medical diagnoses or modify active prescriptions. Always verify dosage adjustments with your doctor.
        </p>
      </div>

      {/* Main Chat Box Container */}
      <Card className="flex-1 flex flex-col p-0 overflow-hidden relative border-border/80 shadow-md">
        
        {/* Chat Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-bg/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Bot size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">CareAI Agent</h3>
              <p className="text-[10px] font-semibold text-success flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success inline-block"></span> Online & Context-Aware
              </p>
            </div>
          </div>
          
          {messages.length > 0 && (
            <Button variant="ghost" onClick={handleClearChat} className="text-xs py-1.5 px-3 flex items-center gap-1 border hover:border-critical/30 hover:bg-critical-light hover:text-critical font-medium">
              <RefreshCw size={12} /> Clear Chat
            </Button>
          )}
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-gradient-to-b from-surface via-surface to-bg/10">
          
          {/* Welcome Screen / Empty Chat */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center max-w-xl mx-auto h-full">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary mb-4 shadow-inner">
                <Bot size={36} />
              </div>
              <h2 className="font-display text-xl font-bold text-ink">Hi, {patientName}! I am CareAI.</h2>
              <p className="font-body text-sm text-muted mt-2 leading-relaxed">
                I have full access to your profile settings, recent glucose readings, insulin logs, meals, activity, and appointments. Ask me anything about your records or diabetes management!
              </p>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mt-8">
                {SUGGESTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.text}
                      onClick={() => handleSendMessage(item.text)}
                      className="flex flex-col items-start text-left p-4 rounded-xl border border-border/80 bg-surface hover:bg-bg hover:border-primary/20 hover:shadow-sm transition-all group duration-200"
                    >
                      <div className={`p-2 rounded-lg mb-2 ${item.color}`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-display text-xs font-bold text-ink mb-1 group-hover:text-primary transition-colors">
                        {item.label}
                      </span>
                      <span className="font-body text-[11px] text-muted leading-snug">
                        "{item.text}"
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages Feed */}
          {messages.length > 0 && (
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={index}
                    className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    {/* Avatar */}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm flex-shrink-0 ${
                      isUser ? "bg-primary-light text-primary" : "bg-bg text-muted border border-border"
                    }`}>
                      {isUser ? <User size={16} /> : <Bot size={16} />}
                    </div>

                    {/* Chat Bubble */}
                    <div className={`p-3.5 rounded-2xl shadow-xs border ${
                      isUser 
                        ? "bg-primary text-white border-primary rounded-tr-none" 
                        : "bg-surface text-ink border-border/80 rounded-tl-none"
                    }`}>
                      {isUser ? (
                        <p className="text-sm font-body leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          {formatMessageText(msg.content)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Typing Loading Indicator */}
          {isSending && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg text-muted border border-border flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="p-3.5 rounded-2xl bg-surface text-ink border border-border/80 rounded-tl-none shadow-xs flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="text-xs font-semibold font-body text-muted">CareAI is reading logs and thinking...</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-1.5 p-3 border border-critical/30 bg-critical-light text-critical text-xs rounded-xl max-w-[80%] mx-auto shadow-xs">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-bg/20">
          <div className="flex gap-2">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask CareAI about your glucose, insulin doses, next appointments, or food tips..."
              className="flex-1 max-h-24 resize-none rounded-xl border border-border/80 bg-surface px-4 py-3 font-body text-sm text-ink outline-none focus:border-primary shadow-xs transition-colors"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputText.trim()}
              className="px-4 rounded-xl flex items-center justify-center h-full self-end shadow-sm"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>

      </Card>
    </div>
  );
}
