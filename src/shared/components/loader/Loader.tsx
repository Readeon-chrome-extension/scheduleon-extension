/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { FC } from 'react';
import styled from '@emotion/styled';

const StyledLoader = styled.div`
  width: 48px;
  height: 48px;
  border: 5px solid var(--global-content-regular-default);
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const Loader: FC = () => {
  return <StyledLoader className="loader" />;
};
