/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */

import useStorage from '@root/src/shared/hooks/useStorage';
import exampleThemeStorage from '@root/src/shared/storages/themeStorage';
import extEnableStorage from '@root/src/shared/storages/extEnableStorage';

import { FC, useState, useRef, useEffect } from 'react';
import ReactToolTip from './ReactTooltip';
import Toggle from '@root/src/shared/components/toggle-button';

interface HeaderProps {}
export const openOrFocusTab = (newUrl: string, baseUrl: string) => {
  chrome.tabs.query({}, tabs => {
    const existingTab = tabs.find(tab => tab?.url?.startsWith(baseUrl));

    if (existingTab) {
      chrome.tabs.update(existingTab.id, { active: true, url: newUrl });
    } else {
      chrome.tabs.create({ url: newUrl });
    }
  });
};

export const webURL = 'https://www.scheduleon.net';
export const patreonUrl = 'https://www.patreon.com';
const Header: FC<HeaderProps> = () => {
  const extEnable = useStorage(extEnableStorage);

  const theme = useStorage(exampleThemeStorage);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  const handleRedirect = () => {
    openOrFocusTab(`${webURL}/`, webURL);
  };

  const handleDropdownToggle = () => {
    setDropdownOpen(prev => !prev);
  };

  const onChange = async () => {
    await chrome.runtime.sendMessage({ action: 'Reload_Patreon' });
    await extEnableStorage.toggle();
  };

  const handleClickOutside = event => {
    if (dropdownRef?.current && !dropdownRef?.current?.contains(event.target)) {
      setDropdownOpen(false);
    }
  };
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <>
      <div className="p-2 bg-slate-900 text-white flex justify-between items-center">
        <div
          className="text-2xl font-bold title cursor-pointer hover:scale-110  active:scale-95 transition-all duration-100"
          id="readeon-title"
          onClick={handleRedirect}>
          Scheduleon
        </div>

        <ReactToolTip text="Click here to go to website" anchorSelect="#readeon-title" place="bottom" />

        <div className="flex justify-center items-center gap-2">
          <div className="bg-slate-900" ref={dropdownRef}>
            <button
              onClick={handleDropdownToggle}
              id="setting-ext-icon"
              className="text-white text-2xl font-bold bg-slate-900 border-none cursor-pointer">
              ⚙️
            </button>

            <ReactToolTip
              style={{ zIndex: 1 }}
              text="Extension Settings"
              anchorSelect="#setting-ext-icon"
              place="bottom-start"
            />

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-68 bg-white rounded-md shadow-lg z-50 text-black">
                <div className="p-2 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">Extension</div>
                    <label className="switch text-black text-sm">
                      <Toggle value={extEnable} onChange={onChange} />
                    </label>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">Theme Toggle</div>
                    <label className="switch text-black text-sm">
                      <Toggle value={theme === 'light'} onChange={() => exampleThemeStorage.toggle()} />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default Header;
