import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

const WidgetContainer = styled(motion.div)`
  position: absolute;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  cursor: move;
  z-index: ${props => props.isDragging ? 100 : 10};
  min-width: 200px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const WidgetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  cursor: move;
`;

const WidgetTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
`;

const WidgetControls = styled.div`
  display: flex;
  gap: 5px;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #333;
  }
`;

const WidgetContent = styled.div`
  flex: 1;
  overflow: auto;
`;

const DraggableWidget = ({ id, title, initialPosition, children, onPositionChange, onRemove, onResize }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 });
  const [size, setSize] = useState(initialPosition?.size || { width: 250, height: 150 });

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const newPosition = { x: info.point.x, y: info.point.y };
    setPosition(newPosition);
    if (onPositionChange) {
      onPositionChange(id, newPosition);
    }
  };

  return (
    <WidgetContainer
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={position}
      animate={{
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        opacity: isDragging ? 0.8 : 1
      }}
      transition={{ type: 'spring', damping: 20 }}
      isDragging={isDragging}
      style={{
        width: size.width,
        height: size.height
      }}
    >
      <WidgetHeader>
        <WidgetTitle>{title}</WidgetTitle>
        <WidgetControls>
          <ControlButton onClick={() => onRemove && onRemove(id)}>×</ControlButton>
        </WidgetControls>
      </WidgetHeader>
      <WidgetContent>
        {children}
      </WidgetContent>
    </WidgetContainer>
  );
};

export default DraggableWidget;
