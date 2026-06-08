import React, { useState } from 'react';
import axios from 'axios';

const CausalAnalysis = ({ wells, apiBase }) => {
  const [activeView, setActiveView] = useState('analyze');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scenario, setScenario] = useState('What if fracturing was more intense?');
  const [wellId1, setWellId1] = useState('');
  const [wellId2, setWellId2] = useState('');

  const wellData = {
    wells: wells.map(w => ({
      Well_ID: w.Well_ID,
      X_Coordinate: w.Coordinates.X,
      Y_Coordinate: w.Coordinates.Y,
      Elevation_m: w.Coordinates.Elevation,
      Depth_Start_m: 0,
      Depth_End_m: Math.max(...w.Layers.map(l => l.Depth_End)),
      Raw_Lithology_Description: w.Layers.map(l =>
        l.Modifiers?.join(', ') || l.Hydro_Property || 'unknown'
      ).join('; ')
    }))
  };

  const wellIds = wells.map(w => w.Well_ID);

  const runAnalysis = async (endpoint, params = {}) => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const response = await axios.post(`${apiBase}${endpoint}`, wellData, { params });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCepr = (cepr) => (
    <div key={cepr.well_id} className="cepr-card">
      <h4>{cepr.well_id}</h4>
      <div className="metrics-row">
        <span>CCI: {(cepr.cci * 100).toFixed(1)}%</span>
        <span>FEP: {cepr.fep?.toFixed(1)}</span>
        <span>HCSS: {(cepr.hcss * 100).toFixed(1)}%</span>
      </div>
      <p><strong>Processes:</strong> {cepr.processes?.length || 0} identified</p>
      {cepr.processes?.slice(0, 5).map((p, i) => (
        <div key={i} className="process-item">
          {p.process_type}: intensity {p.intensity?.toFixed(2)}, confidence {(p.confidence * 100).toFixed(0)}%
        </div>
      ))}
      {cepr.causal_chains?.length > 0 && (
        <div className="chains">
          <strong>Causal chains:</strong>
          {cepr.causal_chains.slice(0, 3).map((chain, i) => (
            <p key={i}>{chain.join(' → ')}</p>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="causal-analysis">
      <h3>Causal Subsurface Intelligence (CSIE)</h3>
      <p className="subtitle">Analyze why subsurface features formed — not just what they are</p>

      <div className="causal-tabs">
        {[
          { id: 'analyze', label: 'CEPR Analysis' },
          { id: 'whatif', label: 'What-If Simulator' },
          { id: 'compare', label: 'Well Comparison' },
          { id: 'predict', label: 'Aquifer Prediction' }
        ].map(tab => (
          <button
            key={tab.id}
            className={activeView === tab.id ? 'active' : ''}
            onClick={() => { setActiveView(tab.id); setResults(null); setError(null); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="causal-controls">
        {activeView === 'analyze' && (
          <button onClick={() => runAnalysis('/api/causal/analyze')} disabled={loading || !wells.length}>
            Run Causal Analysis
          </button>
        )}
        {activeView === 'whatif' && (
          <>
            <input
              type="text"
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              placeholder="e.g. What if cooling was slower?"
            />
            <button
              onClick={() => runAnalysis('/api/causal/what-if', { scenario })}
              disabled={loading || !wells.length}
            >
              Run Scenario
            </button>
          </>
        )}
        {activeView === 'compare' && (
          <>
            <select value={wellId1} onChange={e => setWellId1(e.target.value)}>
              <option value="">Select Well 1</option>
              {wellIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
            <select value={wellId2} onChange={e => setWellId2(e.target.value)}>
              <option value="">Select Well 2</option>
              {wellIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
            <button
              onClick={() => runAnalysis('/api/causal/compare', { well_id1: wellId1, well_id2: wellId2 })}
              disabled={loading || !wellId1 || !wellId2}
            >
              Compare Wells
            </button>
          </>
        )}
        {activeView === 'predict' && (
          <button onClick={() => runAnalysis('/api/causal/predict')} disabled={loading || wells.length < 2}>
            Predict Aquifer Targets
          </button>
        )}
      </div>

      {loading && <div className="causal-loading">Running causal analysis...</div>}
      {error && <div className="causal-error">{error}</div>}

      {results && (
        <div className="causal-results">
          {results.ceprs && results.ceprs.map(formatCepr)}
          {results.original_metrics && (
            <div className="whatif-results">
              <h4>What-If: {scenario}</h4>
              <div className="metrics-compare">
                <div>
                  <strong>Original</strong>
                  <p>CCI: {(results.original_metrics.cci * 100).toFixed(1)}%</p>
                  <p>FEP: {results.original_metrics.fep?.toFixed(1)}</p>
                  <p>HCSS: {(results.original_metrics.hcss * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <strong>Modified</strong>
                  <p>CCI: {(results.modified_metrics.cci * 100).toFixed(1)}%</p>
                  <p>FEP: {results.modified_metrics.fep?.toFixed(1)}</p>
                  <p>HCSS: {(results.modified_metrics.hcss * 100).toFixed(1)}%</p>
                </div>
              </div>
              {results.changes?.map((c, i) => <p key={i}>{c}</p>)}
            </div>
          )}
          {results.metrics && (
            <div className="compare-results">
              <h4>Similarity: {results.well1} vs {results.well2}</h4>
              <p>Type: {results.similarity_type}</p>
              <p>Overall: {(results.metrics.overall_similarity * 100).toFixed(1)}%</p>
              <p>Process: {(results.metrics.process_similarity * 100).toFixed(1)}%</p>
              <p>Chain: {(results.metrics.chain_similarity * 100).toFixed(1)}%</p>
            </div>
          )}
          {results.targets && (
            <div className="predict-results">
              <h4>Predicted Aquifer Targets ({results.count})</h4>
              {results.targets.length === 0 && <p>No targets predicted with current data.</p>}
              {results.targets.map((t, i) => (
                <div key={i} className="target-card">
                  <strong>{t.depth_range || `${t.depth_start}-${t.depth_end}m`}</strong>
                  <p>Confidence: {(t.confidence * 100).toFixed(0)}%</p>
                  <p>{t.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CausalAnalysis;
