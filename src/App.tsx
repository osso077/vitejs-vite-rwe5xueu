
import { useRef, useState, type PointerEvent } from "react";
import "./App.css";

type Room = "home" | "kitchen" | "garden" | "books" | "diary";

const rooms = [
  { id: "kitchen", title: "홈베이킹", description: "달콤한 하루의 시작" },
  { id: "garden", title: "식물 키우기", description: "초록빛 작은 정원" },
  { id: "books", title: "책 정리하기", description: "나만의 작은 서재" },
  { id: "diary", title: "다이어리", description: "오늘의 기록 남기기" },
] as const;

function App() {
  const [room, setRoom] = useState<Room>("home");
  const houseRef = useRef<HTMLDivElement>(null);

  const drag = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScroll: 0,
  });

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const house = houseRef.current;
    if (!house || drag.current.active) return;

    drag.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: house.scrollLeft,
    };

    house.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const house = houseRef.current;

    if (!house || !drag.current.active) return;
    if (drag.current.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.current.startX;

    house.scrollLeft = drag.current.startScroll - distance;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current.pointerId !== event.pointerId) return;

    drag.current.active = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const selectedRoom = rooms.find((item) => item.id === room);

  return (
    <main className="game">
      <header className="top-bar">
        <div className="logo">
          little days <span>♡</span>
        </div>
        <div className="date">MY COZY LITTLE WORLD</div>
      </header>

      {room === "home" ? (
        <>
          <section className="welcome">
            <p className="eyebrow">A LITTLE MOMENT FOR YOURSELF</p>
            <h1>오늘은 어떤 하루를 보내고 싶나요?</h1>
            <p className="subtext">
              서두르지 않아도 괜찮아요.
              <br />
              오늘도 나만의 작은 하루를 만들어 봐요.
            </p>
          </section>

          <section className="house-section">
            <div
              ref={houseRef}
              className="house-viewport"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <img
                className="house-image"
                src="/assets/backgrounds/cozy-hobby-empty-house%20%281%29.png"
                alt="네 개의 공간으로 이루어진 수채화 집"
                draggable={false}
              />
            </div>

            <p className="house-hint">
              ← 마우스나 손가락으로 드래그해서 집을 둘러보세요 →
            </p>
          </section>

          <section className="activity">
            <h2>오늘의 작은 취미</h2>

            <div className="activity-grid">
              {rooms.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setRoom(item.id)}
                >
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="other-room">
          <button
            type="button"
            className="back-button"
            onClick={() => setRoom("home")}
          >
            ← 집으로 돌아가기
          </button>

          <div className="room-message">
            <p className="eyebrow">A LITTLE SPACE FOR YOU</p>
            <h1>{selectedRoom?.title}</h1>
            <p>이 공간은 앞으로 천천히 꾸며 나갈 거예요.</p>
          </div>
        </section>
      )}

      <footer>slow down, enjoy little things ♡</footer>
    </main>
  );
}

export default App;
