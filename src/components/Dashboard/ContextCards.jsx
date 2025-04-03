import React from 'react';
import styled from '@emotion/styled';
import ContextCard from './ContextCard';
import { FaCalendarAlt, FaBell, FaCheckSquare } from 'react-icons/fa';

const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
  width: 100%;
  max-width: 1200px;
`;

const ContextCards = () => {
  return (
    <CardsContainer>
      <ContextCard title="Dagplanning" icon={<FaCalendarAlt />} delay={0.1}>
        <p><strong>09:30</strong> - Standup meeting met het team</p>
        <p><strong>11:00</strong> - Bespreking nieuwe features</p>
        <p><strong>14:00</strong> - Klantgesprek over Portal</p>
        <p><strong>16:30</strong> - Code review sessie</p>
      </ContextCard>
      
      <ContextCard title="Notificaties" icon={<FaBell />} delay={0.2}>
        <p>3 nieuwe berichten in Slack</p>
        <p>Updates beschikbaar voor 2 packages</p>
        <p>Herinnering: Deadline project vrijdag</p>
      </ContextCard>
      
      <ContextCard title="Taken" icon={<FaCheckSquare />} delay={0.3}>
        <p>✓ Documentatie bijwerken</p>
        <p>□ API endpoints testen</p>
        <p>□ Feedback verwerken van laatste review</p>
        <p>□ Presentatie voorbereiden</p>
      </ContextCard>
    </CardsContainer>
  );
};

export default ContextCards;
