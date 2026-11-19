
import { useRef, useState, type PointerEvent } from 'react';
import { createRoot } from 'react-dom/client';

type Ingredient = {
  id: string;
  name: string;
  amount: number;
  color: string;
};

const ingredients: Ingredient[] = [
  { id: 'flour', name: '밀가루', amount: 100, color: '#e8d7bb' },
  { id: 'butter', name: '버터', amount: 50, color: '#f5d8a2' },
  { id: 'sugar', name: '설탕', amount: 40, color: '#f4e9d8' },
  { id: 'egg', name: '달걀', amount: 50, color: '#e5b88e' },
  { id: 'milk', name: '우유', amount: 60, color: '#d7e8ea' },
  { id: 'cocoa', name: '코코아', amount: 15, color: '#9c7364' },
];

type DragInfo = {
  pointerId: number;
  id: string;
  amount: number;
  x: number;
  y: number;
};

function BakingDemo() {
  const [selected, setSelected] = useState(ingredients[0]);
  const [amount, setAmount] = useState(100);
  const [bowl, setBowl] = useState<Record<string, number>>({});
  const [floating, setFloating] = useState<{
    x: number;
    y: number;
    name: string;
  } | null>(null);

  const bowlRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragInfo | null>(null);

  const total = Object.values(bowl).reduce(
    (sum, value) => sum + value, 0
  );

  const inBowl = ingredients.filter(
    (item) => bowl[item.id] > 0
  );

  function addToBowl(id: string, grams: number) {
    setBowl((previous) => ({
      ...previous,
      [id]: (previous[id] || 0) + grams,
    }));
  }

  function choose(item: Ingredient) {
    if (selected.id !== item.id) {
      setSelected(item);
      setAmount(item.amount);
    }
  }

  function dragStart(
    event: PointerEvent<HTMLButtonElement>,
    item: Ingredient
  ) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    choose(item);

    dragRef.current = {
      pointerId: event.pointerId,
      id: item.id,
      amount: selected.id === item.id ? amount : item.amount,
      x: event.clientX,
      y: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function dragMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const distance = Math.hypot(
      event.clientX - drag.x,
      event.clientY - drag.y
    );

    if (distance > 10) {
      const item = ingredients.find(
        (ingredient) => ingredient.id === drag.id
      );

      setFloating({
        x: event.clientX,
        y: event.clientY,
        name: item?.name || '',
      });
    }
  }

  function dragEnd(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const bounds = bowlRef.current?.getBoundingClientRect();

    const moved = Math.hypot(
      event.clientX - drag.x,
      event.clientY - drag.y
    ) > 10;

    if (
      moved &&
      bounds &&
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom
    ) {
      addToBowl(drag.id, drag.amount);
    }

    dragRef.current = null;
    setFloating(null);
  }

  return (
    <main className="baking-game">
      <style>{styles}</style>

      <header className="baking-header">
        <span className="baking-logo">little days ♡</span>
        <span className="baking-subtitle">MY LITTLE KITCHEN</span>
      </header>

      <section className="baking-scene">
        <div className="baking-title">
          <span>A LITTLE BAKING TIME</span>
          <h1>오늘은 무엇을 구워볼까?</h1>
          <p>좋아하는 재료를 자유롭게 담아봐요.</p>
        </div>

        <div
          className="baking-drop-zone"
          ref={bowlRef}
          aria-label="재료를 놓을 믹싱볼 영역"
        >
          <svg
            viewBox="0 0 360 275"
            className="baking-bowl"
            role="img"
            aria-label="도자기 믹싱볼"
          >
            <ellipse
              cx="180" cy="245" rx="124" ry="14"
              fill="#897b6a" opacity=".13"
            />
            <path
              d="M44 88 Q55 228 180 244 Q305 228 316 88 Z"
              fill="#dce7df"
              stroke="#a5b6ac"
              strokeWidth="5"
            />
            <ellipse
              cx="180" cy="88" rx="136" ry="46"
              fill="#f8f5ec"
              stroke="#a5b6ac"
              strokeWidth="5"
            />
            {total > 0 && (
              <ellipse
                cx="180" cy="92" rx="120" ry="32"
                fill="#dcc3a4"
              />
            )}
            <ellipse
              cx="180" cy="82" rx="136" ry="46"
              fill="none"
              stroke="#fffdf6"
              strokeWidth="5"
            />
          </svg>

          <div className="baking-bowl-caption">
            <strong>
              {total === 0 ? '빈 믹싱볼' : `총 ${total}g`}
            </strong>
            <span>
              {total === 0
                ? '재료를 여기로 끌어다 놓아요'
                : `${inBowl.length}가지 재료가 담겼어요`}
            </span>
          </div>
        </div>

        <div className="baking-receipt">
          <div className="baking-receipt-title">
            <strong>담긴 재료</strong>
            <button
              type="button"
              disabled={total === 0}
              onClick={() => setBowl({})}
            >
              비우기
            </button>
          </div>

          <div className="baking-chips">
            {inBowl.length === 0 ? (
              <span className="baking-empty">
                아직 아무 재료도 넣지 않았어요.
              </span>
            ) : (
              inBowl.map((item) => (
                <span className="baking-chip" key={item.id}>
                  {item.name} {bowl[item.id]}g
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="baking-dock" aria-label="재료 보관함">
        <div className="baking-dock-heading">
          <strong>재료 보관함</strong>
          <span>터치해서 선택하거나 믹싱볼로 드래그!</span>
        </div>

        <div className="baking-ingredient-list">
          {ingredients.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                `baking-ingredient ${
                  selected.id === item.id ? 'is-selected' : ''
                }`
              }
              onClick={() => choose(item)}
              onPointerDown={(event) => dragStart(event, item)}
              onPointerMove={dragMove}
              onPointerUp={dragEnd}
              onPointerCancel={() => {
                dragRef.current = null;
                setFloating(null);
              }}
            >
              <span
                className="baking-color"
                style={{ background: item.color }}
              />
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        <div className="baking-measure">
          <label htmlFor="ingredient-amount">
            {selected.name} <strong>{amount}g</strong>
          </label>

          <input
            id="ingredient-amount"
            type="range"
            min="5"
            max="250"
            step="5"
            value={amount}
            onChange={(event) =>
              setAmount(Number(event.target.value))
            }
          />

          <button
            className="baking-add"
            type="button"
            onClick={() => addToBowl(selected.id, amount)}
          >
            믹싱볼에 넣기 +
          </button>
        </div>
      </section>

      {floating && (
        <div
          className="baking-floating"
          style={{ left: floating.x, top: floating.y }}
        >
          {floating.name}
        </div>
      )}
    </main>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Jua&display=swap');

* { box-sizing: border-box; }

html, body, #root {
  margin: 0;
  width: 100%;
  height: 100%;
}

body {
  font-family: 'Gowun Dodum', sans-serif;
  color: #776c63;
  background: #f6f1ec;
}

button, input { font: inherit; }
button { cursor: pointer; }

.baking-game {
  height: 100dvh;
  min-height: 540px;
  display: grid;
  grid-template-rows: 56px minmax(0, 1fr) auto;
  overflow: hidden;
  background: #f5f1ef;
}

.baking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 18px;
  background: #fdfaf6;
}

.baking-logo {
  font: 22px 'Jua', sans-serif;
  color: #8f7c74;
}

.baking-subtitle {
  font-size: 10px;
  letter-spacing: 2px;
  color: #a79c96;
}

.baking-scene {
  position: relative;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(
    #f9f0f5 0%,
    #f7f6ef 69%,
    #e9d4c4 70%,
    #ecdac9 100%
  );
}

.baking-title {
  text-align: center;
  padding: 17px 12px 0;
}

.baking-title > span {
  font-size: 10px;
  letter-spacing: 2px;
  color: #b1a09f;
}

.baking-title h1 {
  margin: 5px 0;
  font: 29px 'Jua', sans-serif;
  color: #86766e;
}

.baking-title p {
  margin: 0;
  font-size: 12px;
  color: #a19790;
}

.baking-drop-zone {
  flex: 1;
  min-height: 180px;
  width: min(100%, 480px);
  display: grid;
  place-items: center;
  padding: 0 14px 28px;
  position: relative;
}

.baking-bowl {
  width: min(76%, 290px);
  min-width: 175px;
  display: block;
  filter: drop-shadow(0 8px 8px #8b7b6a26);
}

.baking-bowl-caption {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  white-space: nowrap;
  background: #fffdf4ed;
  padding: 6px 15px;
  border-radius: 18px;
  box-shadow: 0 4px 12px #9c847016;
}

.baking-bowl-caption strong { font-size: 14px; }
.baking-bowl-caption span { font-size: 10px; }

.baking-receipt {
  width: min(94%, 520px);
  padding: 10px 13px;
  margin: 0 0 13px;
  border-radius: 16px;
  background: #fffdf4e8;
}

.baking-receipt-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
}

.baking-receipt-title button {
  background: none;
  border: 0;
  color: #9a8578;
  font-size: 12px;
  padding: 3px 5px;
}

.baking-receipt-title button:disabled { opacity: .4; }

.baking-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
}

.baking-chip {
  background: #f2e6dc;
  border-radius: 30px;
  padding: 4px 9px;
  font-size: 11px;
}

.baking-empty {
  color: #b5a9a0;
  font-size: 11px;
}

.baking-dock {
  padding: 12px 14px calc(14px + env(safe-area-inset-bottom));
  background: #fffaf6;
  border-top: 1px solid #e9dfd5;
}

.baking-dock-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
}

.baking-dock-heading strong {
  font: 18px 'Jua', sans-serif;
}

.baking-dock-heading span {
  font-size: 10px;
  color: #ab9c90;
}

.baking-ingredient-list {
  display: flex;
  gap: 9px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
}

.baking-ingredient {
  flex: 0 0 77px;
  border: 2px solid #eee4dc;
  border-radius: 15px;
  background: #fffefa;
  padding: 8px 4px;
  color: #74695f;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  touch-action: none;
  user-select: none;
}

.baking-ingredient.is-selected {
  border-color: #a6bdad;
  background: #f2f8f2;
}

.baking-color {
  width: 33px;
  height: 33px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 1px 5px #51453f21;
}

.baking-measure {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
}

.baking-measure label {
  font-size: 12px;
  white-space: nowrap;
}

.baking-measure label strong {
  color: #859c89;
}

.baking-measure input {
  width: 100%;
  accent-color: #9bb3a2;
}

.baking-add {
  border: 0;
  background: #a6b9a7;
  color: white;
  border-radius: 13px;
  padding: 11px 12px;
  white-space: nowrap;
  font-size: 12px;
}

.baking-floating {
  position: fixed;
  z-index: 20;
  pointer-events: none;
  transform: translate(-50%, -120%);
  background: #fffaf2;
  border: 2px solid #a6b9a7;
  border-radius: 20px;
  padding: 9px 13px;
  box-shadow: 0 8px 20px #67564a30;
}

@media (min-width: 850px) {
  .baking-game {
    grid-template-rows: 65px minmax(0, 1fr) auto;
  }

  .baking-ingredient-list { justify-content: center; }
  .baking-measure { max-width: 720px; margin: auto; }
  .baking-title { padding-top: 30px; }
  .baking-title h1 { font-size: 36px; }
}

@media (max-width: 370px) {
  .baking-subtitle { display: none; }
  .baking-measure { gap: 5px; }
  .baking-add { padding: 9px; }
}
`;

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<BakingDemo />);
}
