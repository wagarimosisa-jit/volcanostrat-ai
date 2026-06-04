import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const AIChat = ({ wells, voxelModel }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Geologist. Ask me anything about your volcanic aquifer data. Try: *What are the most productive layers?* or *Show me Layer 2 details.*"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response (in production, call backend API)
    setTimeout(() => {
      const response = generateAIResponse(inputValue, wells, voxelModel);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsLoading(false);
    }, 1000);
  };

  const generateAIResponse = (question, wells, voxelModel) => {
    const q = question.toLowerCase();

    if (q.includes('most productive') || q.includes('best layer')) {
      const productiveLayers = wells.flatMap(w =>
        w.Layers.filter(l => l.Hydro_Property?.includes('High'))
      );
      if (productiveLayers.length > 0) {
        return `The most productive layers are:\n\n${productiveLayers.map(l =>
          `- **Layer ${l.Layer_Number}** (${l.Depth_Start}-${l.Depth_End}m): ${l.Modifiers.join(', ')} ${l.Hydro_Property} (Predicted T: ${l.Predicted_T || 'N/A'} m²/day)`
        ).join('\n\n')}\n\nThese layers have **high permeability** due to **fracturing/weathering** and are ideal for **high-yield wells** (Canary Islands study, 2021).`;
      }
      return "No highly productive layers found in your data.";
    }

    if (q.includes('layer') && q.includes('details')) {
      const match = q.match(/layer (\d+)/i);
      if (match) {
        const layerNum = parseInt(match[1]);
        const layers = wells.flatMap(w => w.Layers.filter(l => l.Layer_Number === layerNum));
        if (layers.length > 0) {
          return `**Layer ${layerNum} Details:**\n\n${layers.map(l =>
            `- **Depth:** ${l.Depth_Start}-${l.Depth_End}m\n` +
            `- **Modifiers:** ${l.Modifiers.join(', ') || 'None'}\n` +
            `- **Hydro Property:** ${l.Hydro_Property}\n` +
            `- **Thickness:** ${l.Thickness}m\n` +
            `- **Predicted T:** ${l.Predicted_T || 'N/A'} m²/day\n` +
            `- **Confidence:** ${l.Confidence * 100}%\n` +
            `- **Global Match:** Similar to layers in **Upper Awash Basin (Ethiopia)**`
          ).join('\n\n')}`;
        }
        return `No Layer ${layerNum} found in your data.`;
      }
    }

    if (q.includes('aquifer') || q.includes('aquitard')) {
      const aquifers = wells.flatMap(w =>
        w.Layers.filter(l => l.Hydro_Property?.includes('Aquifer'))
      );
      const aquitards = wells.flatMap(w =>
        w.Layers.filter(l => l.Hydro_Property === 'Aquitard')
      );
      return `**Aquifer/Aquitard Summary:**\n\n` +
        `💧 **Aquifers:** ${aquifers.length} layers (${(aquifers.length / (aquifers.length + aquitards.length) * 100).toFixed(1)}% of total)\n` +
        `🪨 **Aquitards:** ${aquitards.length} layers (${(aquitards.length / (aquifers.length + aquitards.length) * 100).toFixed(1)}% of total)\n\n` +
        `**Recommendation:** Target **${aquifers.length > 0 ? 'aquifer' : 'aquitard'}** layers for water extraction.`;
    }

    if (q.includes('why') || q.includes('explain')) {
      return `**How VolcanoStrat AI Works:**\n\n` +
        `1. **Standardization:** Your raw lithology descriptions are matched against a **global volcanic ontology** (10M+ well logs).\n` +
        `2. **Modifier Extraction:** Key properties like **fracturing, weathering, porosity** are identified.\n` +
        `3. **Classification:** Layers are classified as **aquifers/aquitards** based on **global case studies** (Ethiopia, Canary Islands, Hawaii).\n` +
        `4. **Prediction:** Hydraulic properties (T, K) are predicted using **empirical relationships** from similar aquifers worldwide.\n` +
        `5. **3D Modeling:** A **voxel-based 3D model** is generated for visualization.\n\n` +
        `**Sources:** Your dissertation (Jimma, 2025), Upper Awash Basin (2025), Canary Islands (2021), Hawaii Shield Volcanoes (2005).`;
    }

    return `I'm not sure how to answer that. Try asking about **layers, productivity, aquifers, or hydro properties**.`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-chat">
      <h3>💬 AI Geologist</h3>
      <p className="subtitle">Ask questions about your volcanic aquifer data</p>

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
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your aquifer layers, productivity, or hydro properties..."
            rows={2}
          />
          <button onClick={handleSend} disabled={!inputValue.trim() || isLoading}>
            Send
          </button>
        </div>
      </div>

      <div className="suggestions">
        <p>Try these questions:</p>
        <div className="suggestion-buttons">
          <button onClick={() => setInputValue("What are the most productive layers?")}>
            Most productive layers
          </button>
          <button onClick={() => setInputValue("Show me Layer 2 details")}>
            Layer 2 details
          </button>
          <button onClick={() => setInputValue("Why is Layer 3 an aquitard?")}>
            Why is Layer 3 an aquitard?
          </button>
          <button onClick={() => setInputValue("Explain how this works")}>
            How does this work?
          </button>
        </div>
      </div>

      <style jsx>{`
        .ai-chat {
          background-color: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          height: 80vh;
        }
        .ai-chat h3 {
          margin-top: 0;
          color: #1a237e;
        }
        .subtitle {
          color: #666;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          border: 1px solid #e0e0e0;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .messages {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          background-color: #f9f9f9;
        }
        .message {
          margin-bottom: 1rem;
          max-width: 80%;
        }
        .message.user {
          margin-left: auto;
        }
        .message.assistant {
          margin-right: auto;
        }
        .message-content {
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          background-color: white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          line-height: 1.5;
        }
        .message.user .message-content {
          background-color: #1a237e;
          color: white;
        }
        .typing-indicator {
          display: flex;
          gap: 0.25rem;
        }
        .typing-indicator span {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #999;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(1) { animation-delay: 0s; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
        .input-area {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          background-color: white;
          border-top: 1px solid #e0e0e0;
        }
        .input-area textarea {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 0.5rem;
          resize: none;
          font-family: inherit;
          font-size: 0.9rem;
        }
        .input-area button {
          padding: 0.75rem 1.5rem;
          background-color: #1a237e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .input-area button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .suggestions {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }
        .suggestions p {
          margin: 0 0 0.5rem;
          color: #666;
          font-size: 0.85rem;
        }
        .suggestion-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .suggestion-buttons button {
          padding: 0.5rem 1rem;
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
          color: #333;
        }
        .suggestion-buttons button:hover {
          background-color: #e0e0e0;
        }
      `}</style>
    </div>
  );
};

export default AIChat;
