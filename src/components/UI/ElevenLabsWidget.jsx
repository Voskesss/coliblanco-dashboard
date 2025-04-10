import React, { useEffect } from 'react';
import styled from '@emotion/styled';

const WidgetContainer = styled.div`
  position: absolute;
  bottom: 100px;
  right: 30px;
  z-index: 1000;
  width: 300px;
  height: 400px;
`;

const ElevenLabsWidget = () => {
  useEffect(() => {
    // Script toevoegen voor de ElevenLabs Convai widget
    const script = document.createElement('script');
    script.src = 'https://elevenlabs.io/convai-widget/index.js';
    script.async = true;
    script.type = 'text/javascript';
    document.body.appendChild(script);

    return () => {
      // Script verwijderen bij unmount
      document.body.removeChild(script);
    };
  }, []);

  return (
    <WidgetContainer>
      <elevenlabs-convai agent-id="rcCO2SKJEBFGJnUr8PZR"></elevenlabs-convai>
    </WidgetContainer>
  );
};

export default ElevenLabsWidget;
