import React, { useContext, useState } from 'react';
import './Search.css';
import { SearchContext } from '../../../../stores/SearchContext'; // Context import

const Search = () => {
  const { setSearchQuery } = useContext(SearchContext); // Context에서 검색어 업데이트 함수 가져오기
  const [isMagnifier, setIsMagnifier] = useState(true); // 돋보기 상태 관리
  const [searchInput, setSearchInput] = useState(''); // 검색창 상태 관리

  const handleToggle = () => {
    setIsMagnifier((prevState) => !prevState); // 돋보기/X 상태 토글
    if (isMagnifier) {
      setSearchQuery(searchInput); // 검색 실행
      //console.log(`${searchInput} 검색 실행`);
    } else {
      setSearchQuery(''); // 검색어 초기화
      setSearchInput(''); // 검색창 초기화
      //console.log('검색어 초기화');
    }
  };

  const handleInputChange = (e) => {
    setSearchInput(e.target.value); // 검색어 입력값 업데이트
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="토론제목, 태그 검색"
        className="search-input"
        value={searchInput}
        onChange={handleInputChange} // 검색창 상태 업데이트
      />
      <img
        src={isMagnifier ? '/magnifier.png' : '/cancel.png'} // 돋보기 또는 X로 변경
        alt={isMagnifier ? 'Search Icon' : 'Clear Icon'}
        className="search-icon"
        onClick={handleToggle} // 돋보기/X 클릭 시 검색 실행/초기화
      />
    </div>
  );
};

export default Search;