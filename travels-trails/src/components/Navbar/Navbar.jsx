import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const Nav = styled.nav`
  background-color: #001529;
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div`
  color: white;
  font-size: 20px;
  font-weight: bold;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 16px;
`;

const Navbar = () => {
  return (
    <Nav>
      <Logo>Travel Trails</Logo>
      <NavLinks>
        <Link to="/statistics">
          <Button type="primary" icon={<BarChartOutlined />}>
            统计概览
          </Button>
        </Link>
      </NavLinks>
    </Nav>
  );
};

export default Navbar; 