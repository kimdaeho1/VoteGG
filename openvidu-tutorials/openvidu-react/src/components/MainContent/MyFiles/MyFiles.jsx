import React, { useState, useEffect } from 'react';
import './MyFiles.css';

const MyFiles = () => {
  const [files, setFiles] = useState([]); // 빈 배열로 초기화하여 파일 목록을 관리합니다.

  // 페이지가 로드될 때 서버에서 파일 목록을 불러오는 함수
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('/api/files');
        if (!response.ok) {
          throw new Error(`Failed to fetch files: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched files:', data.files);

        // 파일 리스트를 업로드 시간 기준으로 내림차순 정렬
        const sortedFiles = data.files.sort(
          (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
        );

        // 가장 최근 3개의 파일만 설정
        setFiles(sortedFiles.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch files:', error);
      }
    };

    fetchFiles();
  }, []);

  const renderPreview = (file) => {
    const fileExtension = file.filename.split('.').pop().toLowerCase();
    
    // 이미지 파일 미리보기
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      return (
        <img 
          src={file.url} 
          alt={file.filename} 
          style={{ width: '200px', height: 'auto' }} // 크기 조정
        />
      );
    }
    // 오디오 파일 미리보기
    else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
      return <audio controls src={file.url} />;
    } 
    // 비디오 파일 미리보기
    else if (['mp4', 'webm', 'avi'].includes(fileExtension)) {
      return <video controls src={file.url} style={{ width: '200px', height: 'auto' }} />;
    } 
    // 텍스트 파일
    else if (['txt', 'pdf'].includes(fileExtension)) {
      return <p>Preview not available for {file.filename}</p>;
    } 
    // 기타 파일
    else {
      return <p>Unsupported file format: {file.filename}</p>;
    }
  };

  return (
    <div className="my-files">
      <h4>My Files</h4>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <div>
              {renderPreview(file)}  {/* 미리보기 표시 */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyFiles;