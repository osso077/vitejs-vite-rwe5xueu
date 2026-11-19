
import { useRef, useState, type PointerEvent } from "react";
import "./App.css";

const rooms = [
  { name: "거실", hobby: "나만의 집 꾸미기" },
  { name: "주방", hobby: "달콤한 홈베이킹" },
  { name: "서재", hobby: "책과 다이어리" },
  { name: "식물방", hobby: "초록빛 식물 키우기" },
];

const houseImage =
  "/assets/backgrounds/cozy-hobby-empty-house%20%281%29.png";

function App() {
  const [roomIndex, setRoomIndex] = useState(0);

  const swipeStart = useRef<{
    id: number;
    x: number;
    y: number;
  } | null>(null);

  const changeRoom = (direction: number) => {
    setRoomIndex((current) =>
      Math.max(0, Math.min(rooms.length - 1, current + direction))
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    swipeStart.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = swipeStart.current;

    if (!start || start.id !== event.pointerId) return;

    swipeStart.current = null;

    const distanceX = event.clientX - start.x;
    const distanceY = event.clientY - start.y;

    if (
      Math.abs(distanceX) < 50 ||
      Math.abs(distanceX) < Math.abs(distanceY)
    ) {
      return;
    }

    // 왼쪽으로 밀면 다음 방, 오른쪽이면 이전 방
    changeRoom(distanceX < 0 ? 1 : -1);
  };

  const handlePointerCancel = () => {
    swipeStart.current = null;
  };

  // 각 방의 중심이 화면 중앙에 오도록 이동
  const roomCenter = 37.5 + roomIndex * 75;

  const panoramaPosition =
    `translate3d(clamp(calc(100vw - 300dvh), ` +
    `calc(50vw - ${roomCenter}dvh), 0px), 0, 0)`;

  return (
    <main className="game">
      <section
        className="game-scene"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        aria-label="스와이프하여 집의 방 이동"
      >
        <div
          className="house-panorama"
          style={{ transform: panoramaPosition }}
        >
          <img
            src={houseImage}
            alt="네 개의 방으로 이루어진 수채화 집"
            draggable={false}
          />
        </div>
      </section>

      <header className="game-header">
        <div className="game-logo">little days ♡</div>
        <div className="game-label">MY COZY HOME</div>
      </header>

      <div className="room-info" aria-live="polite">
        <h1>{rooms[roomIndex].name}</h1>
        <p>{rooms[roomIndex].hobby}</p>
      </div>

      <nav className="room-navigation" aria-label="방 선택">
        {rooms.map((room, index) => (
          <button
            key={room.name}
            type="button"
            className={
              roomIndex === index
                ? "room-dot active"
                : "room-dot"
            }
            aria-label={`${room.name}으로 이동`}
            aria-current={roomIndex === index ? "step" : undefined}
            onClick={() => setRoomIndex(index)}
          />
        ))}
      </nav>

      <p className="swipe-guide">← 옆으로 밀어 방 이동 →</p>
    </main>
  );
}

export default App;
