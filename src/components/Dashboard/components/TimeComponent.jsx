import React from 'react';
import styled from '@emotion/styled';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const TimeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  
  @media (max-width: 480px) {
    margin-top: 20px;
  }
`;

const TimeDisplay = styled.div`
  text-align: center;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  h2 {
    font-size: 48px;
    font-weight: 300;
    margin: 0;
    margin-bottom: 5px;
  }
  
  p {
    font-size: 18px;
    font-weight: 300;
    margin: 0;
    opacity: 0.9;
  }
  
  @media (max-width: 1024px) {
    h2 {
      font-size: 42px;
    }
    
    p {
      font-size: 16px;
    }
  }
  
  @media (max-width: 768px) {
    h2 {
      font-size: 36px;
    }
    
    p {
      font-size: 14px;
    }
  }
  
  @media (max-width: 480px) {
    h2 {
      font-size: 32px;
    }
    
    p {
      font-size: 13px;
    }
  }
`;

const TimeComponent = () => {
  const now = new Date();
  const formattedTime = format(now, 'HH:mm');
  const formattedDay = format(now, 'EEEE', { locale: nl });
  const formattedDate = format(now, 'd MMMM yyyy', { locale: nl });
  
  return (
    <TimeContainer>
      <TimeDisplay>
        <h2>{formattedTime}</h2>
        <p>
          <span>{formattedDay}</span>{' '}
          <span>{formattedDate}</span>
        </p>
      </TimeDisplay>
    </TimeContainer>
  );
};

export default TimeComponent;
