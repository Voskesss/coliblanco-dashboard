import React, { useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import PulsingOrb from '../../UI/PulsingOrb';

const OrbContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  
  @media (max-width: 480px) {
    margin-top: 20px;
    margin-bottom: 20px;
  }
`;

const GlowingOrbStyle = styled.div`
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.4) 40%,
    rgba(255, 255, 255, 0.1) 70%,
    rgba(255, 255, 255, 0) 100%
  );
  box-shadow: 0 0 60px 30px rgba(255, 255, 255, 0.3);
  transform: scale(0.8);
  z-index: 1;
  
  @media (max-width: 1024px) {
    width: 350px;
    height: 350px;
  }
  
  @media (max-width: 768px) {
    width: 300px;
    height: 300px;
  }
  
  @media (max-width: 480px) {
    width: 250px;
    height: 250px;
  }
`;

const OrbCloudStyle = styled(motion.div)`
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 40%,
    rgba(255, 255, 255, 0.02) 70%,
    rgba(255, 255, 255, 0) 100%
  );
  filter: blur(40px);
  transform: scale(1.2);
  z-index: 0;
  
  @media (max-width: 1024px) {
    width: 500px;
    height: 500px;
  }
  
  @media (max-width: 768px) {
    width: 400px;
    height: 400px;
  }
  
  @media (max-width: 480px) {
    width: 300px;
    height: 300px;
  }
`;

const PulsingOrbContainer = styled.div`
  position: absolute;
  z-index: 2;
`;

const OrbComponent = ({ orbStatus }) => {
  const cloudRef = useRef(null);
  const orbRef = useRef(null);
  
  useEffect(() => {
    // Animatie voor de wolk
    if (cloudRef.current) {
      gsap.to(cloudRef.current, {
        scale: 1.3,
        opacity: 0.8,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }, []);
  
  const GlowingOrb = () => {
    return <GlowingOrbStyle />;
  };
  
  const OrbCloud = React.forwardRef((props, ref) => {
    return <OrbCloudStyle ref={ref} {...props} />;
  });
  
  return (
    <OrbContainer>
      <OrbCloud
        ref={cloudRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <GlowingOrb />
      <PulsingOrbContainer>
        <PulsingOrb status={orbStatus} ref={orbRef} className="orb-ref" />
      </PulsingOrbContainer>
    </OrbContainer>
  );
};

export default OrbComponent;
