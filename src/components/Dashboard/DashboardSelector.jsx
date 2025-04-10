import React, { useState } from 'react';
import styled from '@emotion/styled';

const SelectorContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  gap: 10px;
`;

const SelectorButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 8px 15px;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }
  
  &.active {
    background: rgba(255, 255, 255, 0.5);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const DashboardSelector = ({ dashboards, activeDashboard, onSelect }) => {
  return (
    <SelectorContainer>
      {dashboards.map((dashboard) => (
        <SelectorButton
          key={dashboard.id}
          className={activeDashboard === dashboard.id ? 'active' : ''}
          onClick={() => onSelect(dashboard.id)}
        >
          {dashboard.name}
        </SelectorButton>
      ))}
    </SelectorContainer>
  );
};

export default DashboardSelector;
