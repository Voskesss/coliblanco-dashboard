import React, { useState } from 'react';
import GlassDashboard from '../components/Dashboard/GlassDashboard';
import CustomizableDashboard from '../components/Dashboard/CustomizableDashboard';
import MinimalistDashboard from '../components/Dashboard/MinimalistDashboard';
import GlassBackground from '../components/Dashboard/GlassBackground';
import DashboardController from '../components/Dashboard/DashboardController';
import GradientSettings from '../components/UI/GradientSettings';
import styled from '@emotion/styled';

const PageContainer = styled.div`
  height: 100vh;
  overflow: hidden;
  position: relative;
`;

const GlassDashboardPage = () => {
  const dashboardType = 'minimalist';
  const [backgroundGradient, setBackgroundGradient] = useState(
    'linear-gradient(135deg, #e6e9f0 0%, #d3cce3 50%, #e2d1c3 100%)'
  );
  
  const handleGradientChange = (newGradient) => {
    console.log('Nieuwe gradiënt ontvangen in GlassDashboardPage:', newGradient);
    setBackgroundGradient(newGradient);
  };
  
  return (
    <PageContainer>
      <GlassBackground backgroundGradient={backgroundGradient} />
      <DashboardController>
        {dashboardType === 'glass' && <GlassDashboard />}
        {dashboardType === 'customizable' && <CustomizableDashboard />}
        {dashboardType === 'minimalist' && <MinimalistDashboard />}
      </DashboardController>
      <GradientSettings onGradientChange={handleGradientChange} />
    </PageContainer>
  );
};

export default GlassDashboardPage;
