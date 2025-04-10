import React from 'react';
import styled from '@emotion/styled';

const SidebarContainer = styled.div`
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 150px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200px;
  z-index: 10;
  
  @media (max-width: 1024px) {
    width: 120px;
    padding-top: 180px;
  }
  
  @media (max-width: 768px) {
    width: 100px;
    padding-top: 150px;
  }
  
  @media (max-width: 480px) {
    position: fixed;
    width: 100%;
    height: 80px;
    left: 0;
    top: auto;
    bottom: 0;
    flex-direction: row;
    justify-content: space-around;
    padding-top: 0;
    border-radius: 30px 30px 0 0;
  }
`;

const IconButton = styled.button`
  width: 120px;
  height: 120px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a4a4a;
  font-size: 32px;
  cursor: pointer;
  margin-bottom: 25px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 1024px) {
    width: 100px;
    height: 100px;
    font-size: 28px;
  }
  
  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    font-size: 24px;
    margin-bottom: 15px;
  }
  
  @media (max-width: 480px) {
    width: 60px;
    height: 60px;
    font-size: 20px;
    margin-bottom: 0;
    margin-right: 5px;
    margin-left: 5px;
    border-radius: 15px;
  }
`;

const SidebarComponent = () => {
  return (
    <SidebarContainer>
      <IconButton>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8L12 13L20 8V18ZM12 11L4 6H20L12 11Z" fill="currentColor"/>
        </svg>
      </IconButton>
      <IconButton>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
          <path d="M7 12H9V17H7V12Z" fill="currentColor"/>
          <path d="M15 7H17V17H15V7Z" fill="currentColor"/>
          <path d="M11 14H13V17H11V14Z" fill="currentColor"/>
          <path d="M11 10H13V12H11V10Z" fill="currentColor"/>
        </svg>
      </IconButton>
      <IconButton>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.5 2.5C16.5 2.5 18 4 18 6C18 8 16.5 9.5 14.5 9.5C12.5 9.5 11 8 11 6C11 4 12.5 2.5 14.5 2.5ZM7 5C8.5 5 9.5 6 9.5 7.5C9.5 9 8.5 10 7 10C5.5 10 4.5 9 4.5 7.5C4.5 6 5.5 5 7 5ZM14.5 11.5C17 11.5 22 12.67 22 15.17V18H7V15.17C7 12.67 12 11.5 14.5 11.5ZM7 12C4.67 12 0 13.17 0 15.5V18H5V15.17C5 14.5 5.37 13.69 6.03 13C5.55 12.92 4.8 12.75 4 12.75C2.21 12.75 0.8 13.26 0 14" fill="currentColor"/>
        </svg>
      </IconButton>
      <IconButton>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3C7.59 3 4 6.59 4 11C4 15.41 7.59 19 12 19C16.41 19 20 15.41 20 11C20 6.59 16.41 3 12 3ZM12 17C8.69 17 6 14.31 6 11C6 7.69 8.69 5 12 5C15.31 5 18 7.69 18 11C18 14.31 15.31 17 12 17Z" fill="currentColor"/>
          <path d="M11 7H13V13H11V7Z" fill="currentColor"/>
          <path d="M11 15H13V17H11V15Z" fill="currentColor"/>
        </svg>
      </IconButton>
    </SidebarContainer>
  );
};

export default SidebarComponent;
