import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

const CardContainer = styled(motion.div)`
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 350px;
  margin: 0.5rem;
  backdrop-filter: blur(5px);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
`;

const CardIcon = styled.div`
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #555;
  font-size: 1.2rem;
`;

const CardContent = styled.div`
  font-size: 0.95rem;
  color: #444;
  line-height: 1.5;
`;

const ContextCard = ({ title, icon, children, delay = 0 }) => {
  return (
    <CardContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay, 
        ease: [0.43, 0.13, 0.23, 0.96] 
      }}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardIcon>{icon}</CardIcon>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </CardContainer>
  );
};

export default ContextCard;
