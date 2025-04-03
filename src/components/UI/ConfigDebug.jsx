import React from 'react';
import { config } from '../../utils/config';

const ConfigDebug = () => {
  return (
    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px', borderRadius: '5px', fontSize: '12px', maxWidth: '500px', zIndex: 1000 }}>
      <h3>Config Debug</h3>
      <pre>
        {JSON.stringify({
          openaiApiKey: config.openaiApiKey ? `${config.openaiApiKey.substring(0, 10)}...` : 'niet ingesteld',
          sttProvider: config.sttProvider,
          ttsProvider: config.ttsProvider,
          llmProvider: config.llmProvider,
          models: config.models
        }, null, 2)}
      </pre>
    </div>
  );
};

export default ConfigDebug;
