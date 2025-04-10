import React, { useState } from 'react';
import GlassDashboard from '../components/Dashboard/GlassDashboard';
import CustomizableDashboard from '../components/Dashboard/CustomizableDashboard';
import MinimalistDashboard from '../components/Dashboard/MinimalistDashboard';
import GlassBackground from '../components/Dashboard/GlassBackground';
import DashboardController from '../components/Dashboard/DashboardController';
import styled from '@emotion/styled';

const PageContainer = styled.div`
  height: 100vh;
  overflow: hidden;
  position: relative;
`;

const DashboardSelector = styled.div`
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

const GlassDashboardPage = () => {
  const [dashboardType, setDashboardType] = useState('minimalist');
  
  return (
    <PageContainer>
      <GlassBackground />
      <DashboardController>
        <DashboardSelector>
          <SelectorButton 
            className={dashboardType === 'glass' ? 'active' : ''}
            onClick={() => setDashboardType('glass')}
          >
            Glas Dashboard
          </SelectorButton>
          <SelectorButton 
            className={dashboardType === 'customizable' ? 'active' : ''}
            onClick={() => setDashboardType('customizable')}
          >
            Aanpasbaar Dashboard
          </SelectorButton>
          <SelectorButton 
            className={dashboardType === 'minimalist' ? 'active' : ''}
            onClick={() => setDashboardType('minimalist')}
          >
            Minimalistisch Dashboard
          </SelectorButton>
        </DashboardSelector>
        
        {dashboardType === 'glass' && <GlassDashboard />}
        {dashboardType === 'customizable' && <CustomizableDashboard />}
        {dashboardType === 'minimalist' && <MinimalistDashboard />}
      </DashboardController>
    </PageContainer>
  );
};

export default GlassDashboardPage;
