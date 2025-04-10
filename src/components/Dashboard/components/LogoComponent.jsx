import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import logo from '../../../components/UI/logo-coliblanco.png';

const LogoContainer = styled(motion.div)`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  
  img {
    width: 150px;
    height: auto;
  }
  
  @media (max-width: 768px) {
    img {
      width: 120px;
    }
  }
  
  @media (max-width: 480px) {
    position: relative;
    top: 10px;
    left: 0;
    display: flex;
    justify-content: center;
    width: 100%;
    
    img {
      width: 100px;
    }
  }
`;

const LogoComponent = () => {
  return (
    <LogoContainer
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <img src={logo} alt="Coliblanco Logo" />
    </LogoContainer>
  );
};

export default LogoComponent;
