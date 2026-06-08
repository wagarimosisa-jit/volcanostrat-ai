import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const MODES = [
  { id: 'hybrid', label: 'Hybrid', hint: 'Geology + causal first, then LLM' },
  { id: 'geology_only', label: 'Geology only', hint: 'No external LLM' },
  { id: 'general', label: 'General LLM', hint: 'ChatGPT-style with GVAS context' },
];

const AIChat = ({ wells, voxelModel, apiBase = 'http://localhost:8000' }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I'm your **GVAS AI Geologist**. I combine volcanic hydrogeology expertise, " +
        "your well data, causal CSIE analysis, and optional general-purpose LLM conversation.\n\n" +
        "Try: *What are the most productive layers?*, *Explain Ethiopian geology*, or ask any general question in **General LLM** mode."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('hybrid');
  const [provider, setProvider] = useState('auto');
  const [providers, setProviders] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    axios.get(`${apiBase}/api/chat/providers`)
      .then(res => setProviders(res.data.providers || []))
      .catch(() => setProviders([]));
  }, [apiBase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    const userMessage = { role: 'user', content: userText };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data } = await axios.post(`${apiBase}/api/chat`, {
        message: userText,
        history: messages.map(m => ({ role: m.role, content: m.content })),
        wells: wells.length ? wells : null,
        voxel_model: voxelModel || null,
        provider: provider === 'auto' ? null : provider,
        mode,
      });

      const sourceLabel = {
        causal_engine: 'CSIE causal engine',
        ai_geologist: 'GVAS well analysis',
        geology_kb: 'Geology knowledge base',
        fallback: 'Fallback',
      }[data.source] || (data.source?.startsWith('llm:') ? `LLM (${data.provider || data.source})` : data.source);

      const footer = `\n\n---\n*Source: ${sourceLabel} · Mode: ${data.mode}*`;
      setMessages(prev => [...prev, { role: 'assistant', content: data.response + footer }]);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Request failed';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I could not process that request.\n\n**Error:** ${detail}\n\n` +
          'Ensure the backend is running and configure at least one LLM provider in `.env` for general chat.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const configuredProviders = providers.filter(p => p.configured);

  return (
    <div className="ai-chat">
      <h3>💬 AI Geologist</h3>
      <p className="subtitle">
        Hybrid assistant: well data · causal CSIE · geology KB · OpenAI · Anthropic · Gemini · Ollama
      </p>

      <div className="chat-mode-bar">
        <div className="mode-group">
          <label>Mode</label>
          <div className="mode-buttons">
            {MODES.map(m => (
              <button
                key={m.id}
                type="button"
                className={mode === m.id ? 'active' : ''}
                title={m.hint}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="provider-group">
          <label>LLM Provider</label>
          <select value={provider} onChange={e => setProvider(e.target.value)}>
            <option value="auto">Auto (first configured)</option>
            {providers.map(p => (
              <option key={p.name} value={p.name} disabled={!p.configured}>
                {p.name}{p.configured ? '' : ' (not configured)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {configuredProviders.length === 0 && mode !== 'geology_only' && (
        <div className="chat-hint">
          No LLM configured. Add API keys to <code>.env</code> or run Ollama locally.
          Use <strong>Geology only</strong> mode without an LLM.
        </div>
      )}

      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your wells, volcanic geology, or anything else..."
            rows={2}
          />
          <button onClick={handleSend} disabled={!inputValue.trim() || isLoading}>
            Send
          </button>
        </div>
      </div>

      <div className="suggestions">
        <p>Try these:</p>
        <div className="suggestion-buttons">
          <button onClick={() => setInputValue('What are the most productive layers?')}>Productive layers</button>
          <button onClick={() => setInputValue('What if fracturing was more intense?')}>What-if scenario</button>
          <button onClick={() => setInputValue('Explain Ethiopian geology')}>Ethiopian geology</button>
          <button onClick={() => setInputValue('Summarize the key hydrogeology concepts for a report')}>General summary</button>
        </div>
      </div>

      <style>{`
        .chat-mode-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #f0f4ff;
          border-radius: 0.5rem;
          align-items: flex-end;
        }
        .chat-mode-bar label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #555;
          margin-bottom: 0.35rem;
          text-transform: uppercase;
        }
        .mode-buttons { display: flex; gap: 0.35rem; flex-wrap: wrap; }
        .mode-buttons button {
          padding: 0.4rem 0.75rem;
          border: 1px solid #ccc;
          border-radius: 0.35rem;
          background: white;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .mode-buttons button.active {
          background: #1a237e;
          color: white;
          border-color: #1a237e;
        }
        .provider-group select {
          padding: 0.45rem;
          border-radius: 0.35rem;
          border: 1px solid #ccc;
          min-width: 180px;
        }
        .chat-hint {
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          background: #fff8e1;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          color: #5d4037;
        }
      `}</style>
    </div>
  );
};

export default AIChat;
