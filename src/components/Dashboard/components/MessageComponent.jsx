import React from 'react';
import styled from '@emotion/styled';
import ContextCards from '../ContextCards';

const MessageComponentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  
  @media (max-width: 480px) {
    margin-top: 20px;
    margin-bottom: 20px;
  }
`;

const MessageBox = styled.div`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  padding: 20px 30px;
  width: 100%;
  max-width: 800px;
  text-align: center;
  margin-bottom: 20px;
  
  p {
    color: #fff;
    font-size: 24px;
    font-weight: 300;
    line-height: 1.5;
    margin: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 1024px) {
    max-width: 600px;
    padding: 15px 25px;
    
    p {
      font-size: 22px;
    }
  }
  
  @media (max-width: 768px) {
    max-width: 500px;
    padding: 15px 20px;
    
    p {
      font-size: 20px;
    }
  }
  
  @media (max-width: 480px) {
    max-width: 90%;
    padding: 12px 15px;
    
    p {
      font-size: 18px;
    }
  }
`;

const MessageComponent = ({ message, showCards }) => {
  return (
    <MessageComponentContainer>
      <MessageBox>
        <p>{message || "Goedemorgen, ik hoop dat je lekker hebt geslapen!"}</p>
      </MessageBox>
      {showCards && <ContextCards />}
    </MessageComponentContainer>
  );
};

export default MessageComponent;
