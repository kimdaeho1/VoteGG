import { useRecoilValue } from "recoil";
import styled from "styled-components";

import { debateRoomsAtomFamily } from "stores/debateRoomStates";

function RoomInfo({ roomId, type }) {

  const roomInfo = useRecoilValue(debateRoomsAtomFamily(roomId));
  const {
    roomName: title,
    roomOpinionLeft: leftOpinion,
    roomOpinionRight: rightOpinion,
    roomCategory: category,
    leftUserList: { length: leftUsersCnt },
    rightUserList: { length: rightUsersCnt },
    roomHashtags = "",
  } = roomInfo
  const hashTags = roomHashtags.split(",") || [];

  
  return (
    <RoomInfoWrapper>
      <div style={{width: "100%", height: "20%", display: "flex", alignItems: "center"}}>
        <RoomInfoTitle title={title} type={type}>
          {title}
        </RoomInfoTitle>
      </div>
      <IndentedInfoWrapper>
        <ColorBarDiv color="#EF404A" />
        <Opinion color="#EF404A" type={type} title={leftOpinion}>{leftOpinion}</Opinion>
        <Word type={type} color="#EF404A">-</Word>
        <Word type={type} color="#EF404A">{leftUsersCnt}</Word>
        <Word type={type} color="#EF404A">명</Word>
      </IndentedInfoWrapper>
      
      <IndentedInfoWrapper>
        <ColorBarDiv color="#27AAE1" />
        <Opinion color="#27AAE1" type={type} title={rightOpinion}>{rightOpinion}</Opinion>
        <Word type={type} color="#27AAE1">-</Word>
        <Word type={type} color="#27AAE1">{rightUsersCnt}</Word>
        <Word type={type} color="#27AAE1">명</Word>
      </IndentedInfoWrapper>
      
      <IndentedInfoWrapper>
        <ColorBarDiv />
        <Word type={type} color="#FFFFFF">카테고리</Word>
        <Word type={type} color="#FFFFFF">-</Word>
        <Word type={type} color="#FFFFFF">{category}</Word>
      </IndentedInfoWrapper>
        
      <HashTags>
        {hashTags.map((item, index) => (
          <HashTag type={type} key={item + index}>{item}</HashTag>
        ))}
      </HashTags>
    </RoomInfoWrapper>
  );
}

export default RoomInfo;