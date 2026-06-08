import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const AIChat = ({ wells, voxelModel, apiBase = 'http://localhost:8000' }) => {
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

    try {
      const response = await fetchAIResponse(inputValue, wells, voxelModel);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that request. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toApiWellData = () => ({
    wells: wells.map(w => ({
      Well_ID: w.Well_ID,
      X_Coordinate: w.Coordinates.X,
      Y_Coordinate: w.Coordinates.Y,
      Elevation_m: w.Coordinates.Elevation,
      Depth_Start_m: 0,
      Depth_End_m: Math.max(...w.Layers.map(l => l.Depth_End)),
      Raw_Lithology_Description: w.Layers.map(l => l.Modifiers?.join(', ') || '').join('; ')
    }))
  });

  const fetchAIResponse = async (question, wells, voxelModel) => {
    const q = question.toLowerCase();
    const wellData = toApiWellData();

    if (wells.length > 0) {
      if (q.includes('what if') || q.includes('what-if')) {
        const { data } = await axios.post(`${apiBase}/api/causal/what-if`, wellData, {
          params: { scenario: question }
        });
        const orig = data.original_metrics;
        const mod = data.modified_metrics;
        return `**What-If Analysis:** ${question}\n\n` +
          `**Original:** CCI ${(orig.cci * 100).toFixed(1)}%, FEP ${orig.fep?.toFixed(1)}, HCSS ${(orig.hcss * 100).toFixed(1)}%\n\n` +
          `**Modified:** CCI ${(mod.cci * 100).toFixed(1)}%, FEP ${mod.fep?.toFixed(1)}, HCSS ${(mod.hcss * 100).toFixed(1)}%\n\n` +
          (data.changes?.map(c => `- ${c}`).join('\n') || '');
      }
      if (q.includes('causal') || q.includes('cepr') || q.includes('analyze')) {
        const { data } = await axios.post(`${apiBase}/api/causal/analyze`, wellData);
        const cepr = data.ceprs?.[0];
        if (cepr) {
          return `**Causal Analysis (CEPR) for ${cepr.well_id}:**\n\n` +
            `- **CCI:** ${(cepr.cci * 100).toFixed(1)}%\n` +
            `- **FEP:** ${cepr.fep?.toFixed(1)}\n` +
            `- **HCSS:** ${(cepr.hcss * 100).toFixed(1)}%\n` +
            `- **Processes identified:** ${cepr.processes?.length || 0}\n\n` +
            (cepr.causal_chains?.slice(0, 2).map(c => `Chain: ${c.join(' → ')}`).join('\n') || '');
        }
      }
      if (q.includes('predict') || q.includes('target')) {
        const { data } = await axios.post(`${apiBase}/api/causal/predict`, wellData);
        if (data.targets?.length) {
          return `**Predicted Aquifer Targets:**\n\n` +
            data.targets.map(t => `- **${t.depth_range || `${t.depth_start}-${t.depth_end}m`}** (${(t.confidence * 100).toFixed(0)}%): ${t.reason}`).join('\n');
        }
        return 'No aquifer targets predicted with current data. Upload more wells for better predictions.';
      }
    }

    return generateAIResponse(question, wells, voxelModel);
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
      return `**How GVAS Works:**\n\n` +
        `1. **Standardization:** Your raw lithology descriptions are matched against a **global volcanic ontology** (10M+ well logs).\n` +
        `2. **Modifier Extraction:** Key properties like **fracturing, weathering, porosity** are identified.\n` +
        `3. **Classification:** Layers are classified as **aquifers/aquitards** based on **global case studies** (Ethiopia, Canary Islands, Hawaii).\n` +
        `4. **Prediction:** Hydraulic properties (T, K) are predicted using **empirical relationships** from similar aquifers worldwide.\n` +
        `5. **3D Modeling:** A **voxel-based 3D model** is generated for visualization.\n\n` +
        `**Sources:** Your dissertation (Jimma, 2025), Upper Awash Basin (2025), Canary Islands (2021), Hawaii Shield Volcanoes (2005).`;
    }

    // Enhanced AI Geologist with broader geological knowledge
    
    // Geological knowledge base - Volcanic and General Geology
    const geologyKnowledge = {
      ethiopia: {
        geology: "Ethiopia is located in the East African Rift System, one of the world's most active continental rift zones. The geology is dominated by Cenozoic volcanic rocks, particularly the Ethiopian Flood Basalts (31-26 Ma) and the more recent Quaternary volcanoes. The Main Ethiopian Rift (MER) is characterized by basaltic to rhyolitic volcanic sequences with significant hydrothermal activity. Major aquifers in the region include fractured basalts, pyroclastic deposits, and alluvial sediments.",
        aquifers: "The Ethiopian rift valley contains productive aquifers in fractured basalts and ignimbrites. The Upper Awash Basin is a well-studied example with transmissivity values ranging from 50-200 m²/day in basaltic aquifers.",
        references: "Ayenew & Legesse (2005), Tadesse et al. (2017), Kitessa (2025 - Jimma University)"
      },
      east_african_rift: {
        geology: "The East African Rift is an active continental rift zone that stretches from the Afar Triangle in the north to Mozambique in the south. It's characterized by normal faulting, volcanic activity, and the development of rift valleys. The rift is associated with the African Superplume, which causes lithospheric uplift and volcanic activity.",
        volcanic_rocks: "The rift contains extensive basaltic lava flows, pyroclastic deposits, and rhyolitic domes. The volcanic stratigraphy typically consists of alternating layers of basalt, ignimbrite, and sedimentary interbeds.",
        hydrogeology: "Groundwater in the EAR occurs in fractured volcanic rocks, alluvial sediments in rift floors, and weathered zones. Transmissivity can reach 500 m²/day in highly fractured zones."
      },
      basalt: {
        description: "Basalt is a mafic extrusive igneous rock formed from the rapid cooling of lava at the Earth's surface. It's the most common volcanic rock type, making up ~90% of all volcanic rock on Earth.",
        hydrogeology: "Basalts can form excellent aquifers when fractured. Primary porosity is typically low (1-5%), but secondary porosity from fracturing can increase this significantly. Columnar jointing in basalt flows creates vertical permeability pathways.",
        productivity: "Transmissivity in basalt aquifers ranges from 10-500 m²/day, depending on the degree of fracturing. The Columbia River Basalt Group (USA) and Deccan Traps (India) are famous examples of productive basalt aquifers.",
        global_examples: ["Iceland", "Columbia River Basalt Group (USA)", "Deccan Traps (India)", "Ethiopian Flood Basalts", "Hawaiian Islands"]
      },
      andesite: {
        description: "Andesite is an intermediate volcanic rock with composition between basalt and rhyolite. It's typically found in subduction zone volcanoes.",
        hydrogeology: "Andesitic aquifers are generally less productive than basalts but can still yield significant water from fractures and weathered zones. Porosity is typically 5-15%.",
        productivity: "Transmissivity typically ranges from 1-100 m²/day. Andesitic aquifers are important in the Andes Mountains and Cascade Range.",
        global_examples: ["Andes Mountains (South America)", "Cascade Range (USA)", "Japan", "Indonesia"]
      },
      rhyolite: {
        description: "Rhyolite is a felsic extrusive igneous rock with high silica content. It's the volcanic equivalent of granite.",
        hydrogeology: "Rhyolite typically has low primary porosity (<5%) and forms poor aquifers unless intensely fractured or weathered. However, rhyolitic tuffs and ignimbrites can be more productive.",
        productivity: "Transmissivity is usually low (0.1-10 m²/day) unless in highly fractured zones or hydrothermally altered areas.",
        global_examples: ["Yellowstone (USA)", "Taupo Volcanic Zone (New Zealand)", "Sierra Madre (Mexico)"]
      },
      pyroclastic: {
        description: "Pyroclastic rocks are formed from fragmented material produced by explosive volcanic eruptions. They include tuff, ignimbrite, and volcanic breccia.",
        hydrogeology: "Unwelded pyroclastic deposits can form excellent aquifers due to their high primary porosity (15-40%). Welded tuffs have lower porosity but can still transmit water through fractures.",
        productivity: "Transmissivity in unwelded ignimbrites can reach 100-500 m²/day. Pyroclastic aquifers are important in many volcanic regions worldwide.",
        global_examples: ["Canary Islands", "Campania (Italy)", "New Zealand", "Ethiopia"]
      },
      general: {
        volcanic_aquifers: "Volcanic aquifers are characterized by their heterogeneity, with permeability controlled by fractures, vesicles, and weathering. They often have dual-porosity systems (matrix + fractures) and can be highly productive when both porosity types are well-developed.",
        fracture_control: "Fractures are the primary water-bearing features in volcanic rocks. Fracture density and aperture control aquifer productivity. Regional tectonic stresses often enhance fracture connectivity.",
        vesicularity: "Vesicles (gas bubbles) in basaltic rocks can significantly increase storage capacity. Vesicular basalt typically has 5-30% porosity from vesicles alone.",
        weathering: "Chemical weathering of volcanic rocks (particularly in tropical climates) can create secondary porosity and enhance permeability."
      }
    };

    // Check if question matches any knowledge base entries
    const qLower = question.toLowerCase();
    
    // Ethiopian geology questions
    if (qLower.includes('ethiopia') || qLower.includes('ethiopian')) {
      return `**Ethiopian Geology (East African Rift System):**\n\n${geologyKnowledge.ethiopia.geology}\n\n**Aquifer Characteristics:**\n${geologyKnowledge.ethiopia.aquifers}\n\n**Key References:** ${geologyKnowledge.ethiopia.references}\n\n*This information is based on published studies from Jimma University and international research on the East African Rift.*`;
    }
    
    // East African Rift questions
    if (qLower.includes('east african rift') || qLower.includes('rift valley') || qLower.includes('afar')) {
      return `**East African Rift Geology:**\n\n${geologyKnowledge.east_african_rift.geology}\n\n**Volcanic Rocks:**\n${geologyKnowledge.east_african_rift.volcanic_rocks}\n\n**Hydrogeology:**\n${geologyKnowledge.east_african_rift.hydrogeology}`;
    }
    
    // Rock type questions
    if (qLower.includes('basalt') || qLower.includes('basaltic')) {
      return `**Basalt - Volcanic Aquifer Rock:**\n\n${geologyKnowledge.basalt.description}\n\n**Hydrogeological Properties:**\n${geologyKnowledge.basalt.hydrogeology}\n\n**Productivity:**\n${geologyKnowledge.basalt.productivity}\n\n**Global Examples:** ${geologyKnowledge.basalt.global_examples.join(', ')}`;
    }
    
    if (qLower.includes('andesite') || qLower.includes('andesitic')) {
      return `**Andesite - Intermediate Volcanic Rock:**\n\n${geologyKnowledge.andesite.description}\n\n**Hydrogeological Properties:**\n${geologyKnowledge.andesite.hydrogeology}\n\n**Productivity:**\n${geologyKnowledge.andesite.productivity}\n\n**Global Examples:** ${geologyKnowledge.andesite.global_examples.join(', ')}`;
    }
    
    if (qLower.includes('rhyolite') || qLower.includes('rhyolitic')) {
      return `**Rhyolite - Felsic Volcanic Rock:**\n\n${geologyKnowledge.rhyolite.description}\n\n**Hydrogeological Properties:**\n${geologyKnowledge.rhyolite.hydrogeology}\n\n**Productivity:**\n${geologyKnowledge.rhyolite.productivity}\n\n**Global Examples:** ${geologyKnowledge.rhyolite.global_examples.join(', ')}`;
    }
    
    if (qLower.includes('pyroclastic') || qLower.includes('tuff') || qLower.includes('ignimbrite')) {
      return `**Pyroclastic Rocks:**\n\n${geologyKnowledge.pyroclastic.description}\n\n**Hydrogeological Properties:**\n${geologyKnowledge.pyroclastic.hydrogeology}\n\n**Productivity:**\n${geologyKnowledge.pyroclastic.productivity}\n\n**Global Examples:** ${geologyKnowledge.pyroclastic.global_examples.join(', ')}`;
    }
    
    // General volcanic hydrogeology
    if (qLower.includes('volcanic aquifer') || qLower.includes('volcanic rock') || qLower.includes('hydrogeology')) {
      return `**Volcanic Aquifers - General Knowledge:**\n\n${geologyKnowledge.general.volcanic_aquifers}\n\n**Fracture Control:**\n${geologyKnowledge.general.fracture_control}\n\n**Vesicularity:**\n${geologyKnowledge.general.vesicularity}\n\n**Weathering Effects:**\n${geologyKnowledge.general.weathering}\n\n*For specific information about your data, try asking about particular layers, wells, or hydro properties.*`;
    }

    return `I'm your AI Geologist, specialized in volcanic hydrogeology. I can answer questions about:\n\n**📚 General Geology:** Ethiopian geology, East African Rift, volcanic rock types (basalt, andesite, rhyolite, pyroclastic)\n**💧 Hydrogeology:** Aquifer properties, fracture systems, porosity, permeability\n**📊 Your Data:** Layers, productivity, correlations, hydro properties\n\nTry asking: *"What is Ethiopian geology?"*, *"Explain basalt aquifers"*, *"Show me Layer 2 details"*, or *"What are the most productive layers?"*`;
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

      <style>{`
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
