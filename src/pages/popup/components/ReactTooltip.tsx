/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */

import { CSSProperties } from 'react';
import { Tooltip, type PlacesType } from 'react-tooltip';

interface IReactToolTip {
  text: string;
  anchorSelect: string;
  clickable?: boolean;
  place: PlacesType;
  style?: CSSProperties;
}

export default function ReactToolTip({ text, anchorSelect, clickable = true, place, style }: IReactToolTip) {
  return (
    <>
      <Tooltip
        className="react-tooltip"
        style={style}
        anchorSelect={anchorSelect}
        clickable={clickable}
        content={text}
        place={place}></Tooltip>
    </>
  );
}
