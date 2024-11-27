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
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'rgba(169, 169, 169, 0.5)', // 배경 투명 처리
      },
    });
    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);

    const positionX = 1430; // 전체 X 좌표 위치
    const positionY = 120
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
    World.add(world, [leftWall, rightWall, roopWall]);

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
    });

    // 계란을 주기적으로 추가
    const interval = setInterval(function() {
      const randomX = positionX + (Math.random() * 400);
      const randomY = positionY + 100
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
        World.add(world, egg);
      };

      img.onerror = (e) => {
        console.error("이미지 로드 실패", e);
      };
    }, 3000);

    // Cleanup: 컴포넌트가 unmount 될 때 Matter.js 설정을 정리
    return () => {
      clearInterval(interval);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
    };
  }, [roomNumber]);

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
