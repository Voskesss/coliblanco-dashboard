import React, { useEffect, useRef, forwardRef } from 'react';
import styled from '@emotion/styled';
import { gsap } from 'gsap';

const OrbContainer = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const InnerOrb = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.2) 70%);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
`;

const OuterRing = styled.div`
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 5px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
`;

const PulsingOrb = forwardRef(({ status = 'idle' }, ref) => {
  const innerOrbRef = useRef(null);
  const outerRingRef = useRef(null);
  const containerRef = useRef(null);
  
  // Expose refs to parent component
  React.useImperativeHandle(ref, () => ({
    innerOrb: innerOrbRef.current,
    outerRing: outerRingRef.current,
    container: containerRef.current,
    animate: (type) => {
      if (type === 'speak') {
        // Speciale animatie voor wanneer de AI spreekt
        gsap.to(outerRingRef.current, {
          boxShadow: '0 0 25px rgba(255, 255, 255, 0.9)',
          scale: 1.1,
          duration: 0.3,
          repeat: 1,
          yoyo: true,
          ease: "power2.inOut"
        });
        
        gsap.to(innerOrbRef.current, {
          opacity: 0.95,
          scale: 1.05,
          duration: 0.2,
          repeat: 2,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    }
  }));
  
  useEffect(() => {
    if (innerOrbRef.current && outerRingRef.current) {
      // Clear any existing animations
      gsap.killTweensOf(innerOrbRef.current);
      gsap.killTweensOf(outerRingRef.current);
      
      // Set up animations based on status
      const timeline = gsap.timeline({ repeat: -1, yoyo: true });
      
      switch(status) {
        case 'active':
          // Faster, more intense pulsing for active state
          timeline.to(innerOrbRef.current, {
            scale: 1.1,
            opacity: 0.9,
            duration: 0.8,
            ease: "power2.inOut"
          });
          
          gsap.to(outerRingRef.current, {
            scale: 1.05,
            opacity: 0.7,
            duration: 1.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
          break;
          
        case 'listening':
          // Gentle wave-like pulsing for listening state
          timeline.to(innerOrbRef.current, {
            scale: 1.08,
            opacity: 0.85,
            duration: 1.5,
            ease: "sine.inOut"
          });
          
          gsap.to(outerRingRef.current, {
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.8)',
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
          break;
          
        case 'processing':
          // Rotating effect for processing state
          gsap.to(outerRingRef.current, {
            rotation: 360,
            duration: 8,
            repeat: -1,
            ease: "none"
          });
          
          timeline.to(innerOrbRef.current, {
            scale: 1.05,
            opacity: 0.8,
            duration: 1,
            ease: "power1.inOut"
          });
          break;
          
        default: // idle
          // Subtle breathing effect for idle state
          timeline.to(innerOrbRef.current, {
            scale: 1.03,
            opacity: 0.75,
            duration: 2,
            ease: "sine.inOut"
          });
          
          gsap.to(outerRingRef.current, {
            opacity: 0.6,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
      }
    }
    
    return () => {
      // Clean up animations when component unmounts
      if (innerOrbRef.current) gsap.killTweensOf(innerOrbRef.current);
      if (outerRingRef.current) gsap.killTweensOf(outerRingRef.current);
    };
  }, [status]);
  
  return (
    <OrbContainer ref={containerRef}>
      <OuterRing ref={outerRingRef} />
      <InnerOrb ref={innerOrbRef} />
    </OrbContainer>
  );
});

export default PulsingOrb;
