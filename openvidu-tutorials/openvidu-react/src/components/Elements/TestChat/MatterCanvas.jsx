import React, { useEffect, useRef } from 'react';
import { Engine, Render, Runner, Bodies, World, MouseConstraint, Mouse, Events } from 'matter-js';

const MatterCanvas = ({ roomNumber }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Matter.js 엔진 설정
    const engine = Engine.create();
    const world = engine.world;

    const render = Render.create({
      element: canvasRef.current, // 캔버스를 ref로 연결
      engine: engine,
      options: {
        width: 550,
        height: 700,
        wireframes: false,
        background: 'rgba(0,0,0,0)', // 배경 투명 처리
      },
    });
    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);

    // 바닥 생성
    const ground = Bodies.rectangle(400, 700, 810, 30, { 
      isStatic: true,
      render: {
        fillStyle: 'rgba(0, 0, 0, 0)', // 투명한 검정색
      },
    });
    World.add(world, ground);

    // 양옆 벽 생성
    const leftWall = Bodies.rectangle(0, 400, 30, 800, { isStatic: true, render: { fillStyle: 'rgba(0,0,0,0)' } });
    const rightWall = Bodies.rectangle(460, 400, 30, 800, { isStatic: true, render: { fillStyle: 'rgba(0,0,0,0)' } });
    const roopWall = Bodies.rectangle(400, 0, 810, 100, { isStatic: true, render: { fillStyle: 'rgba(0,0,0,0)' } });
    World.add(world, [leftWall, rightWall, roopWall]);

    // 마우스 제약 조건 추가
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.1,
        maxForce: 0.01, // 마우스로 이동할 때 최대 힘을 제한 (속도 제한)
        render: { visible: false },
      },
    });
    World.add(world, mouseConstraint);

    // 계란을 주기적으로 추가
    const interval = setInterval(function() {
      const randomX = Math.random() * 400;
    
      // 이미지를 로드하고 onload 이벤트를 사용하여 이미지를 로드한 후 Matter.js에 추가
      const img = new Image();
      img.src = "/resources/images/egg.png"; // 올바른 이미지 URL

      img.onload = () => {
        const egg = Bodies.circle(randomX, 100, 10, {
          restitution: 0.3,
          friction: 0.4,
          render: {
            sprite: {
              texture: img.src, // 로드된 이미지 URL을 사용
              xScale: 0.3, // 이미지의 가로 크기 비율
              yScale: 0.3, // 이미지의 세로 크기 비율
              zIndex: 1,
            },
          },
        });
        World.add(world, egg); // 월드에 추가
      };
    
      img.onerror = (e) => {
        console.error("이미지 로드 실패", e);
      };
    }, 3000);

    // 마우스 제약 조건에서 startdrag와 enddrag 이벤트 활용
    Events.on(mouseConstraint, "startdrag", (event) => {
      // 드래그 시작 시, 해당 물체에 collisionFilter 설정
      const draggedObject = event.body;
      if (draggedObject) {
        // 드래그 시작 시 충돌 필터 변경
        draggedObject.collisionFilter = {
          group: -1,  // 다른 물체와 충돌하지 않도록 설정
          category: 0x0001,
          mask: 0x0000,
        };
      };
    });

    Events.on(mouseConstraint, "enddrag", (event) => {
      // 드래그 종료 시, 원래 상태로 복원
      const draggedObject = event.body;
      if (draggedObject) {
        draggedObject.collisionFilter = {
          group: 0, // 기본 그룹으로 복원 (충돌 허용)
          category: 0x0001,
          mask: 0x0001, // 기본적으로 다른 물체와 충돌하도록 설정
        };
      }
    });

    // Cleanup: 컴포넌트가 unmount 될 때 Matter.js 설정을 정리
    return () => {
      clearInterval(interval);  // 계란 추가 주기를 중지
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
    };
  }, [roomNumber]);

  return (
    <div
      ref={canvasRef}
      style={{
        position: "absolute",
        top: "60px", // 채팅창 상단에서 조금 아래
        left: "0",
        right: "0",
        bottom: "100px", // 채팅 입력창을 가리지 않도록 아래 여백 추가
        zIndex: 0, // 채팅창보다 뒤로 배치
      }}
    ></div>
  );
};

export default MatterCanvas;
