import React, { useEffect, useRef, useState  } from 'react';
import Matter from 'matter-js';
import { handleVote, getVoteCount } from '../../../votecount';
import './MatterCanvas.css';
import { useToast } from '../Toast/ToastContext';

const { Engine, Render, Runner, Bodies, World, MouseConstraint, Mouse, Events } = Matter;
const MatterCanvas = ({ roomNumber, socket }) => {
  const canvasRef = useRef(null);
  const draggedEgg = useRef(null); // 드래그 중인 계란을 추적
  let eggCount = 0; // 계란 숫자
  let eggs = []; // 계란 목록 배열

  const token = localStorage.getItem("token");
  const username = token ? getUsernameFromToken(token) : "Unknown User"; // username 가져오기
  const isObserver = window.location.pathname.includes("/observer"); // 옵저버 판단
  const { addToast } = useToast();
  
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
  
    const positionX = window.innerWidth / 1.35; // 전체 X 좌표 위치
    const positionY = window.innerHeight / 12;

    const chatWindow = document.querySelector('.chat-window');
    const chatRect = chatWindow.getBoundingClientRect();
    // 바닥 생성
    const ground = Bodies.rectangle(
      chatRect.left + chatRect.width / 2,
      chatRect.bottom - 60, // 바닥을 채팅창 하단에 위치하도록 조정
      chatRect.width,
      80,
      {
        isStatic: true,
        render: {
          fillStyle: 'rgba(0, 0, 0, 0)', // CSS의 테두리 색상과 유사한 색상
        },
      }
    );
    World.add(world, ground);
  
    // 양옆 벽 생성
    const leftWall = Bodies.rectangle(
      chatRect.left, // 왼쪽 벽을 채팅창의 왼쪽에 위치하도록 조정
      chatRect.top + chatRect.height / 2,
      30,
      chatRect.height,
      {
        isStatic: true,
        render: {
          fillStyle: 'rgba(0, 0, 0, 0)',
        },
      }
    );
    const rightWall = Bodies.rectangle(
      chatRect.right, // 오른쪽 벽을 채팅창의 오른쪽에 위치하도록 조정
      chatRect.top + chatRect.height / 2,
      30,
      chatRect.height,
      {
        isStatic: true,
        render: {
          fillStyle: 'rgba(0, 0, 0, 0)',
        },
      }
    );
    const roopWall = Bodies.rectangle(
      chatRect.left + chatRect.width / 2,
      chatRect.top + 30, // 천장을 채팅창의 위쪽에 위치하도록 조정
      chatRect.width,
      70,
      {
        isStatic: true,
        render: {
          fillStyle: 'rgba(0, 0, 0, 0)',
        },
      }
    );
    
    var thick = 100
    const removeBoxT = Bodies.rectangle(window.innerWidth / 2 , 0, window.innerWidth, thick, { isStatic: true, render: { fillStyle: 'rgba(255, 0, 0, 0.1)', } });
    const removeBoxB = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + (thick / 2), window.innerWidth, thick, { isStatic: true, render: { fillStyle: 'rgba(255, 0, 0, 0.1)', } });
    const removeBoxL = Bodies.rectangle(0 - 100, window.innerHeight / 2, thick, window.innerHeight, { isStatic: true, render: { fillStyle: 'rgba(255, 0, 0, 0.1)', } });
    const removeBoxR = Bodies.rectangle(window.innerWidth + (thick / 2), window.innerHeight / 2, thick, window.innerHeight, { isStatic: true, render: { fillStyle: 'rgba(255, 0, 0, 0.1)', } });
  
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

    document.addEventListener("mouseover", (event) => {
      /* 계란 드래그 상태에서 스트리밍 화면에 아웃라인 생성 */
      if (draggedEgg.current){
        const streamComponent = event.target.closest('.streamcomponent');
        if (event.target.closest('.streamcomponent')) {
          const rect = streamComponent.getBoundingClientRect(); // 스트리밍 화면의 위치와 크기 가져오기

          // 스트리밍 컴포넌트 강조
          streamComponent.classList.add('highlighted');

          // voteOverlay가 이미 추가되어 있지 않다면 추가
          if (!streamComponent.querySelector('.vote-overlay')) {
              const voteOverlay = document.createElement("div");
              voteOverlay.className = "vote-overlay"; // 클래스 설정

              // "투표하기"와 "던지기" 텍스트를 각기 다른 영역에 배치
              const leftText = document.createElement("span");
              leftText.className = "vote-left"; // 왼쪽 텍스트 클래스
              leftText.textContent = "추천하기";

              const rightText = document.createElement("span");
              rightText.className = "vote-right"; // 오른쪽 텍스트 클래스
              rightText.textContent = "공격하기";

              voteOverlay.appendChild(leftText);
              voteOverlay.appendChild(rightText);
              streamComponent.appendChild(voteOverlay);
          }

          /* 아웃라인 초기화 */
          streamComponent.addEventListener("mouseleave", () => {
            streamComponent.classList.remove('highlighted');
            const voteOverlay = streamComponent.querySelector('.vote-overlay');
            if (voteOverlay) {
                streamComponent.removeChild(voteOverlay); // voteOverlay 제거
            }
          });
        }
      }
    });
  
    document.addEventListener("mouseup", (event) => {
      mouse.button = -1; // 마우스 버튼 해제 상태
      
      // 드래그가 끝난 후 계란의 크기를 원래대로 되돌리기
      if (draggedEgg.current) {
        draggedEgg.current.render.sprite.xScale = 0.3;
        draggedEgg.current.render.sprite.yScale = 0.3;        

        const streamComponent = event.target.closest('.streamcomponent');
        if (streamComponent){
          // 클릭된 위치가 왼쪽인지 오른쪽인지 판단
          const rect = streamComponent.getBoundingClientRect();
          const clickX = event.clientX; // 마우스 클릭 X 좌표
          const streamWidth = rect.width;
          const streamHeight = rect.height;
          const midX = rect.left + streamWidth / 2; // 스트리밍 화면의 중간 X 좌표
          const midY = rect.top + streamHeight / 2; // 스트리밍 화면의 중간 Y 좌표

          var user = findUserInformation(event); // 드래그 한 위치의 스트리밍 화면을 확인하고 유저 정보 찾아오기
          if (user)
          {
            if (clickX < midX) {
              // 왼쪽 절반 클릭 시 추천
              const voteLeft = streamComponent.querySelector('.vote-left');
              if (voteLeft) {
                  console.log("왼쪽 클릭 - 투표하기");                
                  // 투표 처리
                  const { maxVoteCount, usedVoteCount} = getVoteCount( roomNumber, username );
                  handleVote(roomNumber, username, user, 1, maxVoteCount - usedVoteCount, addToast); // 1은 사용된 투표권 수
  
                  streamComponent.classList.add('grow');
  
                  // 일정 시간 후 애니메이션 클래스 제거
                  setTimeout(() => {
                    streamComponent.classList.remove('grow');
                  }, 500);
                }
            } else {
              // 오른쪽 절반 클릭 시 공격
              const voteRight = streamComponent.querySelector('.vote-right');
              if (voteRight) {
                // 중간 기준으로 랜덤 값 생성
                const randomX = midX + (Math.random() - 0.5) * streamWidth * 0.9; // -20% ~ +20% 범위 내 랜덤 X
                const randomY = midY + (Math.random() - 0.5) * streamHeight * 0.9; // -20% ~ +20% 범위 내 랜덤 Y
  
                // 랜덤 값이 화면을 벗어나지 않도록 제한
                const targetwidth = Math.max(rect.left, Math.min(randomX, rect.right)); // 왼쪽과 오른쪽 범위 제한
                const targetheight = Math.max(rect.top, Math.min(randomY, rect.bottom)); // 위와 아래 범위 제한
                
                throwEgg(targetwidth, targetheight);            
                console.log("오른쪽 클릭 - 던지기");
                const { maxVoteCount, usedVoteCount} = getVoteCount( roomNumber, username );
                handleVote(roomNumber, username, user, -1, maxVoteCount - usedVoteCount, addToast);
              }
            }
            World.remove(world, draggedEgg.current); // 드래그 중인 계란 제거
            eggs = eggs.filter(egg => egg !== draggedEgg.current); // 배열에서 드래그 중인 계란 필터링
            eggCount -= 1; // 계란 개수 감소
            draggedEgg.current = null; // draggedEgg 초기화
          }          
           /* 아웃라인 초기화 */
          streamComponent.classList.remove('highlighted');
          const voteOverlay = streamComponent.querySelector('.vote-overlay');
          if (voteOverlay) {
              streamComponent.removeChild(voteOverlay); // voteOverlay 제거
          }

          draggedEgg.current = null; // 더 이상 드래그 중이 아님
        }        
      }      
    });

    // 해당 마우스 위치의 스트리밍 화면 유저 정보 가져오기
    const findUserInformation = (event) => {
      const streamComponent = event.target.closest('.streamcomponent');
      if (streamComponent) {
        const videoElement = streamComponent.querySelector('video');
        if (videoElement) {
          const clientData = videoElement.getAttribute('data-client-data');
          if (clientData) {
            console.log("UserName:", clientData);
            return clientData;
          }
        }
      }
      return null; // 사용자 정보를 찾지 못한 경우
    };
    
  
    // 계란을 생성하는 함수
    const addEgg = () => {
      // 채팅창 위치와 크기 정보를 이용해 계란 생성 위치를 설정
      const chatWindow = document.querySelector('.chat-window');
      const chatRect = chatWindow.getBoundingClientRect();

      const randomX = chatRect.left + 10 + Math.random() * (chatRect.width - 20);
      const randomY = chatRect.top + 150;
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
      console.log(n + ' egg removed');
      const eggsToRemove = eggs.slice(0, n); // 배열에서 첫 n개의 계란을 선택
      eggsToRemove.forEach(egg => {
        World.remove(world, egg);  // Matter.js에서 해당 계란 제거
        console.log("Egg removed");
      });
      eggs = eggs.filter(egg => !eggsToRemove.includes(egg));  // 제거된 계란을 배열에서 삭제
      eggCount -= eggsToRemove.length; // 계란 개수 감소
      console.log(`Egg count after removal: ${eggCount}`);
    };

    const throwEgg = (targetX, targetY, callback) => {
      console.log("throwEgg!");
      // 화면 크기
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // 화면 가장자리에서 계란을 생성할 때, 가장자리로부터 떨어진 거리 (패딩)
      const edgePadding = 100;

      // 화면 가장자리에서 랜덤한 위치 선택
      const randomEdge = Math.floor(Math.random() * 3);  // 0: 상단, 1: 우측, 2: 하단, 3: 좌측

      let startX = 0;
      let startY = 0;

      // 각 화면 가장자리에서 랜덤한 위치 선택
      // 각 화면 가장자리에서 랜덤한 위치 선택
      switch (randomEdge) {
        case 0: // 상단
          startX = Math.random() * (screenWidth * 0.5 - 2 * edgePadding) + edgePadding;
          startY = edgePadding;
          break;
        case 1: // 하단
          startX = Math.random() * (screenWidth * 0.5 - 2 * edgePadding) + edgePadding;
          startY = screenHeight - edgePadding;
          break;
        case 2: // 좌측
          startX = edgePadding;
          startY = Math.random() * (screenHeight - 2 * edgePadding) + edgePadding;
          break;
      }
    
      // 소켓 통신으로 이벤트 전송
      const data = { startX, startY, targetX, targetY, callback };
      socket.emit('egg_throw', data);
    
      // 실제 애니메이션 구현
      executeThrowAnimation(startX, startY, targetX, targetY, callback);
    };
    
    const executeThrowAnimation = (startX, startY, targetX, targetY, callback ) => {
      const flightTime = 20;
      const gravity = engine.world.gravity.y || 1;
    
      const img = new Image();
      img.src = "/resources/images/egg.png";
    
      img.onload = () => {
        const egg = Bodies.circle(startX, startY, 10, {
          restitution: 0.3,
          friction: 0.4,
          render: {
            sprite: {
              texture: img.src,
              xScale: 0.3,
              yScale: 0.3,
            },
          },
        });
    
        World.add(engine.world, egg);
    
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;
        const velocityX = deltaX / flightTime;
        const velocityY = deltaY / flightTime - 0.2 * gravity * flightTime;
    
        Matter.Body.setVelocity(egg, { x: velocityX, y: velocityY });

        const newImg = new Image();
        newImg.src = "/resources/images/eggthrow.png"; // 새로운 이미지 경로
    
        newImg.onload = () => {
          Matter.Events.on(engine, "afterUpdate", () => {
            const distanceX = Math.abs(egg.position.x - targetX);
            const distanceY = Math.abs(egg.position.y - targetY);
    
            // 목표에 도달하면
            if (distanceX + distanceY < 50) {
              console.log("egg arrival!");
              World.remove(engine.world, egg);
    
              const newEgg = Bodies.circle(egg.position.x, egg.position.y, 20, {
                isStatic: true,
                collisionFilter: { group: -2, mask: 0 },
                render: {
                  sprite: {
                    texture: newImg.src,
                    xScale: 0.8,
                    yScale: 0.8,
                  },
                },
              });
    
              World.add(engine.world, newEgg);
              console.log("egg broken!");

              // 3초 후 계란 제거
              setTimeout(() => {
                console.log('egg hit!');
                // 목표 위치에서 streamcomponent 요소 찾기
                const streamComponent = document.elementFromPoint(targetX, targetY).closest('.streamcomponent');
                if (streamComponent) {
                  streamComponent.classList.add('shake');

                  // 일정 시간 후 애니메이션 클래스 제거
                  setTimeout(() => {
                    streamComponent.classList.remove('shake');
                  }, 500);
                }
              }, 20);
    
              // 3초 후 계란 제거
              setTimeout(() => {
                World.remove(engine.world, newEgg);
                console.log("egg disappeared!");
              }, 3000);
    
              Matter.Events.off(engine, "afterUpdate");
            }
          });
        };
    
        newImg.onerror = (e) => {
          console.error("새 이미지 로드 실패:", e);
        };
      };
    
      img.onerror = (e) => {
        console.error("이미지 로드 실패:", e);
      };
    };
    
    if(isObserver)
    {
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
          removeEggs(nowVoteCount - eggCount); // 추가로 계란 제거
        }
      }, 1000);
    }    
    
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
  
    // 소켓 이벤트 설정
    if (socket) {
      const handleEggThrow = (data) => {
        // 자신이 보낸 이벤트는 무시합니다.
        if (data.senderId === socket.id) {
          return;
        }
    
        console.log('Egg throw received:', data);
        const { startX, startY, targetX, targetY, callback } = data;
        executeThrowAnimation(startX, startY, targetX, targetY, callback, () => {
          console.log("Throw animation complete");          
        });
      };

      socket.on('egg_throw', handleEggThrow);

      // 컴포넌트 언마운트 시 리스너 해제
      return () => {
        socket.off('egg_throw', handleEggThrow);
        Render.stop(render);
        Runner.stop(runner);
        Engine.clear(engine);
      };
    } else {
      console.error("Socket not available");
    }
  }, [roomNumber]); // eggCount를 의존성 배열에서 제외

  useEffect(() => {
    const updateCanvasPosition = () => {
      if (canvasRef.current) {
        canvasRef.current.style.top = `${-window.scrollY}px`;
      }
    };
  
    window.addEventListener("scroll", updateCanvasPosition);
    return () => {
      window.removeEventListener("scroll", updateCanvasPosition);
    };
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{
        position: "fixed", // 화면 전체를 덮도록 고정
        top: `${window.scrollY}px`,
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