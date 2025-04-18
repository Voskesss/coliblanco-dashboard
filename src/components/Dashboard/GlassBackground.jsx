import React from 'react';
import styled from '@emotion/styled';

const BackgroundWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  overflow: hidden;
`;

const GradientCircle = styled.div`
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%);
  filter: blur(20px);
`;

const GlassBackground = ({ backgroundGradient }) => {
  return (
    <BackgroundWrapper className="background-wrapper" style={{ background: backgroundGradient }}>
      <GradientCircle 
        style={{
          width: '800px',
          height: '800px',
          top: '10%',
          left: '20%',
          opacity: 0.7,
        }}
      />
      <GradientCircle 
        style={{
          width: '600px',
          height: '600px',
          bottom: '15%',
          right: '10%',
          opacity: 0.5,
          background: 'linear-gradient(135deg, rgba(255, 184, 108, 0.3) 0%, rgba(255, 124, 67, 0.1) 100%)',
        }}
      />
      <GradientCircle 
        style={{
          width: '500px',
          height: '500px',
          top: '60%',
          left: '10%',
          opacity: 0.4,
          background: 'linear-gradient(135deg, rgba(133, 255, 189, 0.2) 0%, rgba(255, 251, 125, 0.1) 100%)',
        }}
      />
    </BackgroundWrapper>
  );
};

export default GlassBackground;
