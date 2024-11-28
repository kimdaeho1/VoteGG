import React, { useEffect, useRef } from 'react';
import { Engine, Render, Runner, Bodies, World, MouseConstraint, Mouse, Events } from 'matter-js';

const MatterCanvas = ({ roomNumber }) => {
  const canvasRef = useRef(null);
  const draggedEgg = useRef(null); // 드래그 중인 계란을 추적
  let eggCount = 0; // 계란 숫자
  let eggs = []; // 계란 목록 배열

  const token = localStorage.getItem("token");
  const username = token ? getUsernameFromToken(token) : "Unknown User"; // username 가져오기

  useEffect(() => {
    // Matter.js 엔진 설정
    const engine = Engine.create();
    const world = engine.world;
  
    const render = Render.create({
      element: canvasRef.current, // 캔버스를 ref로 연결
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'rgba(0, 0, 0, 0)', // 배경 투명 처리
      },
    });
    Render.run(render);
  
    const runner = Runner.create();
    Runner.run(runner, engine);
  
    const positionX = 1430; // 전체 X 좌표 위치
    const positionY = 120;
    // 바닥 생성
    const ground = Bodies.rectangle(positionX + 400, positionY + 700, 810, 30, { 
      isStatic: true,
      render: {
        fillStyle: 'rgba(0, 0, 0, 0)', // 투명한 검정색
      },
    });
    World.add(world, ground);
  
    // 양옆 벽 생성
    const leftWall = Bodies.rectangle(positionX + 0, positionY + 400, 30, 800, { isStatic: true, render: { fillStyle: 'rgba(0,0,0,1)' } });
    const rightWall = Bodies.rectangle(positionX + 460, positionY + 400, 30, 800, { isStatic: true, render: { fillStyle: 'rgba(0,0,0,1)' } });
    const roopWall = Bodies.rectangle(positionX + 235, positionY + 0, 500, 100, { isStatic: true, render: { fillStyle: 'rgba(0,0,0,1)' } });
  
    const removeBoxT = Bodies.rectangle(window.innerWidth / 2 , 0, window.innerWidth, 30, { isStatic: true, render: { fillStyle: 'rgba(255, 0, 0, 0.5)', } });
    const removeBoxB = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 30, window.innerWidth, 30, { isStatic: true, render: { fillStyle: 'rgba(255, 0, 0, 0.5)', } });
    const removeBoxL = Bodies.rectangle(0 - 30, window.innerHeight / 2, 30, window.innerHeight, { isStatic: true, render: { fillStyle: 'rgba(255, 0, 0, 0.5)', } });
    const removeBoxR = Bodies.rectangle(window.innerWidth, window.innerHeight / 2, 30, window.innerHeight, { isStatic: true, render: { fillStyle: 'rgba(255, 0, 0, 0.5)', } });
  
    World.add(world, [leftWall, rightWall, roopWall]); // 채팅창
    World.add(world, [removeBoxT, removeBoxB, removeBoxL, removeBoxR]) // 화면 밖
  
    // 외부에서 마우스 이벤트 처리
    const mouse = Mouse.create(document.body); // 캔버스가 아닌 전체 문서에서 마우스 이벤트 처리
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.1,
        maxForce: 0.01, // 마우스로 이동할 때 최대 힘을 제한 (속도 제한)
        render: { visible: false },
      },
    });
    World.add(world, mouseConstraint);
  
    // 문서 전체에서 마우스 좌표 업데이트
    document.addEventListener("mousemove", (event) => {
      const rect = render.canvas.getBoundingClientRect(); // 캔버스 위치 기준으로 좌표 계산
      mouse.position.x = event.clientX - rect.left;
      mouse.position.y = event.clientY - rect.top;
    });
  
    document.addEventListener("mousedown", () => {
      mouse.button = 0; // 마우스 버튼 눌림 상태
    });
  
    document.addEventListener("mouseup", () => {
      mouse.button = -1; // 마우스 버튼 해제 상태
      // 드래그가 끝난 후 계란의 크기를 원래대로 되돌리기
      if (draggedEgg.current) {
        draggedEgg.current.render.sprite.xScale = 0.3;
        draggedEgg.current.render.sprite.yScale = 0.3;
        draggedEgg.current = null; // 더 이상 드래그 중이 아님
      }
      
      findUserInformation(); // 드래그 한 위치의 스트리밍 화면을 확인하고 유저 정보 찾아오기
    });

    // 해당 마우스 위치의 스트리밍 화면 유저 정보 가져오기
    const findUserInformation = () => {
      if (event.target.closest('.streamcomponent')) {
        const videoElement = event.target.closest('video'); // 누른 요소의 id 가져오기
        console.log("Clicked on a streamcomponent element!");
        if (videoElement) {
          const videoId = videoElement.id; // id 저장
          console.log("Clicked video element ID:", videoId);
          const connectionId = "con_" + videoId.split("_con_")[1]; // 뒷부분 정보만 가져오기
          console.log(connectionId);

          // OpenviduFinal에서 session 가져오기          
          const session = window.session;
          console.log('Openvidu session:', session);

          const connection = session.remoteConnections.get(connectionId); // 연결정보로 유저 찾기
          if (connection) {
            const clientData = JSON.parse(connection.data).clientData; // 클라이언트 Data찾기
            const sessionId = JSON.parse(connection.data).session; // 클라이언트 Data찾기
            console.log("UserName:", clientData);
          }
        }
      }
    }
  
    // 계란을 생성하는 함수
    const addEgg = () => {
      const randomX = positionX + (Math.random() * 400);
      const randomY = positionY + 100;
      const img = new Image();
      img.src = "/resources/images/egg.png"; // 올바른 이미지 URL
  
      img.onload = () => {
        const egg = Bodies.circle(randomX, randomY, 10, {
          restitution: 0.3,
          friction: 0.4,
          render: {
            sprite: {
              texture: img.src,
              xScale: 0.3,
              yScale: 0.3,
              zIndex: 1,
            },
          },
        });
  
        // 드래그 중인 계란 추적
        Events.on(engine, 'beforeUpdate', () => {
          if (mouseConstraint.body === egg) {
            egg.render.sprite.xScale = 1;
            egg.render.sprite.yScale = 1;
            draggedEgg.current = egg; // 드래그 중인 계란을 추적
          }
        });
  
        World.add(world, egg);
        eggs.push(egg); // 배열에 저장
        eggCount += 1; // 이전 값을 기반으로 새로운 값을 설정
      };
  
      img.onerror = (e) => {
        console.error("이미지 로드 실패", e);
      };
    };

    // 계란을 한 번에 n개 제거하는 함수
    const removeEggs = (n) => {
      const eggsToRemove = eggs.slice(0, n); // 배열에서 첫 n개의 계란을 선택
      eggsToRemove.forEach(egg => {
        World.remove(world, egg);  // Matter.js에서 해당 계란 제거
        console.log("Egg removed");
      });
      eggs = eggs.filter(egg => !eggsToRemove.includes(egg));  // 제거된 계란을 배열에서 삭제
      eggCount -= eggsToRemove.length; // 계란 개수 감소
      console.log(`Egg count after removal: ${eggCount}`);
    };
  
    // 계란을 주기적으로 추가 (3초마다)
    const interval = setInterval(() => {
      const votes = JSON.parse(localStorage.getItem("votes")) || {};
      // votes[roomNumber][userId]가 존재하는지 확인
      var maxVoteCount = votes[roomNumber]?.[username]?.maxVoteCount || 0; // 기본값 0
      var usedVoteCount = Number(votes[roomNumber]?.[username]?.usedVoteCount || 0); // 기본값 0
      var nowVoteCount = maxVoteCount - usedVoteCount;
  
      if (eggCount < nowVoteCount) {
        addEgg(); // 계란 개수가 nowVoteCount보다 적으면 계란 생성
        console.log(nowVoteCount)
        console.log(eggCount);
      }
      else if (eggCount > nowVoteCount) {
        removeEggs(nowVoteCount - eggCount);
      }
    }, 1000);
    
    // 충돌 감지 및 물체 제거
    Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
  
        // 충돌한 물체가 removeBox와 충돌한 경우
        if (bodyA === removeBoxT || bodyB === removeBoxT ||
            bodyA === removeBoxB || bodyB === removeBoxB ||
            bodyA === removeBoxL || bodyB === removeBoxL ||
            bodyA === removeBoxR || bodyB === removeBoxR) {
  
          // removeBox와 충돌한 물체(계란)를 찾음
          const egg = bodyA === removeBoxT || bodyA === removeBoxB || bodyA === removeBoxL || bodyA === removeBoxR
            ? (bodyB === removeBoxT || bodyB === removeBoxB || bodyB === removeBoxL || bodyB === removeBoxR ? bodyA : bodyB)
            : (bodyA === removeBoxT || bodyA === removeBoxB || bodyA === removeBoxL || bodyA === removeBoxR ? bodyB : bodyA);
  
          // 계란 제거
          eggs = eggs.filter(item => item !== egg);
          World.remove(world, egg);
          eggCount -= 1;
          console.log("Destroy egg!");
          // 새로운 계란 추가
          addEgg();
        }
      });
    });
  
    // Cleanup: 컴포넌트가 unmount 될 때 Matter.js 설정을 정리
    return () => {
      clearInterval(interval);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
    };
  }, [roomNumber]); // eggCount를 의존성 배열에서 제외

  return (
    <div
      ref={canvasRef}
      style={{
        position: "fixed", // 화면 전체를 덮도록 고정
        top: 0,
        left: 0,
        width: "100%", // 화면 전체 너비
        height: "100%", // 화면 전체 높이
        zIndex: 0,
        pointerEvents: "none", // 클릭 이벤트가 UI로 전달되도록 설정
      }}
    ></div>
  );
};

export default MatterCanvas;

const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username;
  } catch (error) {
    console.error("Failed to parse token:", error);
    return "Unknown User";
  }
};