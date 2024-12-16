import React, { createContext, useState } from 'react';

// Context 생성
export const SearchContext = createContext();

// Provider 컴포넌트
export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState(''); // 검색어 상태

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchContext.Provider>
  );
};