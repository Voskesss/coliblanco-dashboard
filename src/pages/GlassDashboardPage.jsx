import React from 'react';
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

const GlassDashboardPage = () => {
  const dashboardType = 'minimalist';
  
  return (
    <PageContainer>
      <GlassBackground />
      <DashboardController>
        {dashboardType === 'glass' && <GlassDashboard />}
        {dashboardType === 'customizable' && <CustomizableDashboard />}
        {dashboardType === 'minimalist' && <MinimalistDashboard />}
      </DashboardController>
    </PageContainer>
  );
};

export default GlassDashboardPage;
