
import { useRef, useState, type PointerEvent } from "react";
import { createRoot } from "react-dom/client";

type Ingredient = {
  id: string;
  name: string;
  symbol: string;
  kind: "pour" | "egg";
  min: number;
  max: number;
  color: string;
};

const ingredients: Ingredient[] = [
  { id: "flour", name: "밀가루", symbol: "🌾", kind: "pour", min: 30, max: 260, color: "#E7D5B7" },
  { id: "butter", name: "버터", symbol: "🧈", kind: "pour", min: 10, max: 160, color: "#F6DB9A" },
  { id: "sugar", name: "설탕", symbol: "🍬", kind: "pour", min: 10, max: 180, color: "#EFE6DD" },
  { id: "egg", name: "달걀", symbol: "🥚", kind: "egg", min: 0, max: 0, color: "#E7BA8A" },
  { id: "milk", name: "우유", symbol: "🥛", kind: "pour", min: 20, max: 250, color: "#D5E5E8" },
  { id: "cocoa", name: "코코아", symbol: "🍫", kind: "pour", min: 5, max: 60, color: "#B38D7A" },
];

type Drag = {
  id: number;
  ingredient: Ingredient;
  portion: number;
  x: number;
  y: number;
};

function amountLabel(value: number) {
  if (value < 34) return "조금";
  if (value < 68) return "적당히";
  return "듬뿍";
}

function toGrams(item: Ingredient, portion: number) {
  const raw = item.min + ((item.max - item.min) * portion) / 100;
  return Math.round(raw / 5) * 5;
}

function BakingDemo() {
  const [selected, setSelected] = useState<Ingredient>(ingredients[0]);
  const [portion, setPortion] = useState(50);
  const [bowl, setBowl] = useState<Record<string, number>>({});
  const [eggCount, setEggCount] = useState(0);
  const [cracking, setCracking] = useState(false);
  const [crackHits, setCrackHits] = useState(0);
  const [floating, setFloating] = useState<{
    x: number;
    y: number;
    name: string;
  } | null>(null);

  const bowlRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const addedIngredients = ingredients.filter((item) =>
    item.kind === "egg" ? eggCount > 0 : (bowl[item.id] || 0) > 0
  );

  const total = Object.values(bowl).reduce((sum, grams) => sum + grams, 0)
    + eggCount * 50;

  function selectIngredient(item: Ingredient) {
    if (selected.id !== item.id) {
      setSelected(item);
      setPortion(50);
    }
  }

  function putIngredient(item: Ingredient, value: number) {
    if (item.kind === "egg") {
      setCrackHits(0);
      setCracking(true);
      return;
    }

    // 횟수가 아니라 설정한 양으로 교체
    setBowl((previous) => ({
      ...previous,
      [item.id]: toGrams(item, value),
    }));
  }

  function crackEgg() {
    if (crackHits === 0) {
      setCrackHits(1);
    } else {
      setEggCount((count) => count + 1);
      setCrackHits(0);
      setCracking(false);
    }
  }

  function startDrag(
    event: PointerEvent<HTMLButtonElement>,
    item: Ingredient
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const currentPortion = selected.id === item.id ? portion : 50;
    selectIngredient(item);

    dragRef.current = {
      id: event.pointerId,
      ingredient: item,
      portion: currentPortion,
      x: event.clientX,
      y: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 12) {
      setFloating({
        x: event.clientX,
        y: event.clientY,
        name: drag.ingredient.name,
      });
    }
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    const bounds = bowlRef.current?.getBoundingClientRect();
    const moved = Math.hypot(event.clientX - drag.x, event.clientY - drag.y);

    if (
      moved > 12 &&
      bounds &&
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom
    ) {
      putIngredient(drag.ingredient, drag.portion);
    }

    dragRef.current = null;
    setFloating(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
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
          <p>좋아하는 재료를 마음껏 골라봐요.</p>
        </div>

        <div className="baking-drop-zone" ref={bowlRef}>
          <svg className="baking-bowl" viewBox="0 0 360 275" role="img" aria-label="믹싱볼">
            <ellipse cx="180" cy="245" rx="124" ry="14" fill="#897B6A" opacity=".13"/>
            <path
              d="M44 88 Q55 228 180 244 Q305 228 316 88 Z"
              fill="#DCE7DF"
              stroke="#A5B6AC"
              strokeWidth="5"
            />
            <ellipse cx="180" cy="88" rx="136" ry="46" fill="#F8F5EC" stroke="#A5B6AC" strokeWidth="5"/>
            {total > 0 && (
              <ellipse
                cx="180"
                cy="92"
                rx="120"
                ry="32"
                fill="#E7C9A8"
                opacity={Math.min(1, 0.4 + total / 500)}
              />
            )}
            {eggCount > 0 && (
              <ellipse cx="180" cy="86" rx="27" ry="19" fill="#F5C568"/>
            )}
            <ellipse cx="180" cy="82" rx="136" ry="46" fill="none" stroke="#FFFDF6" strokeWidth="5"/>
          </svg>

          <div className="bowl-caption">
            <strong>{total === 0 ? "빈 믹싱볼" : "나만의 반죽 준비 중"}</strong>
            <span>
              {total === 0
                ? "재료를 믹싱볼로 끌어오세요"
                : `${addedIngredients.length}가지 재료가 담겼어요`}
            </span>
          </div>
        </div>

        <div className="baking-receipt">
          <div className="receipt-heading">
            <strong>내가 담은 재료</strong>
            <button
              type="button"
              disabled={total === 0}
              onClick={() => {
                setBowl({});
                setEggCount(0);
              }}
            >
              모두 비우기
            </button>
          </div>

          <div className="baking-chips">
            {addedIngredients.length === 0 ? (
              <span className="empty-message">어떤 재료부터 넣어볼까?</span>
            ) : (
              addedIngredients.map((item) => {
                let label = "";

                if (item.kind === "egg") {
                  label = `${eggCount}개`;
                } else {
                  const grams = bowl[item.id];
                  const value = ((grams - item.min) / (item.max - item.min)) * 100;
                  label = amountLabel(value);
                }

                return (
                  <span className="baking-chip" key={item.id}>
                    {item.name} · {label}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="baking-dock">
        <div className="dock-heading">
          <strong>재료 보관함</strong>
          <span>터치하거나 믹싱볼로 드래그해요</span>
        </div>

        <div className="ingredient-list">
          {ingredients.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ingredient ${selected.id === item.id ? "selected" : ""}`}
              onClick={() => selectIngredient(item)}
              onPointerDown={(event) => startDrag(event, item)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={() => {
                dragRef.current = null;
                setFloating(null);
              }}
            >
              <span className="ingredient-symbol">{item.symbol}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        {selected.kind === "egg" ? (
          <div className="egg-controls">
            <span>🥚 달걀은 직접 깨서 넣어요! · 현재 {eggCount}개</span>
            <button type="button" onClick={() => putIngredient(selected, 0)}>
              달걀 깨기
            </button>
          </div>
        ) : (
          <div className="measure-controls">
            <div className="measure-cup" aria-hidden="true">
              <div
                className="measure-fill"
                style={{
                  height: `${15 + portion * 0.75}%`,
                  background: selected.color,
                }}
              />
            </div>

            <div className="measure-main">
              <div className="measure-caption">
                <span>{selected.name}</span>
                <strong>{amountLabel(portion)}</strong>
              </div>

              <input
                type="range"
                aria-label={`${selected.name} 양 조절`}
                min="0"
                max="100"
                step="1"
                value={portion}
                onChange={(event) => setPortion(Number(event.target.value))}
              />

              <div className="measure-labels">
                <span>조금</span>
                <span>적당히</span>
                <span>듬뿍</span>
              </div>
            </div>

            <button
              type="button"
              className="pour-button"
              onClick={() => putIngredient(selected, portion)}
            >
              이만큼 담기
            </button>
          </div>
        )}
      </section>

      {floating && (
        <div className="floating-ingredient" style={{ left: floating.x, top: floating.y }}>
          {floating.name}
        </div>
      )}

      {cracking && (
        <div className="egg-overlay">
          <div className="egg-dialog" role="dialog" aria-modal="true" aria-label="달걀 깨기">
            <p className="egg-eyebrow">CRACK THE EGG</p>
            <h2>달걀을 톡톡!</h2>
            <p>
              {crackHits === 0
                ? "달걀을 터치해서 껍질에 금을 내봐요."
                : "금이 갔어요! 한 번 더 톡!"}
            </p>

            <button
              type="button"
              className={`egg-to-crack ${crackHits > 0 ? "cracked" : ""}`}
              onClick={crackEgg}
              aria-label="달걀 껍질 두드리기"
            >
              🥚
              {crackHits > 0 && <span className="crack-mark">⌁</span>}
            </button>

            <button
              type="button"
              className="cancel-egg"
              onClick={() => {
                setCracking(false);
                setCrackHits(0);
              }}
            >
              돌아가기
            </button>
          </div>
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
  background: #F7F2EE;
  color: #766D63;
  font-family: 'Gowun Dodum', sans-serif;
}

button, input { font: inherit; }
button { cursor: pointer; }

.baking-game {
  height: 100dvh;
  min-height: 480px;
  overflow: hidden;
  display: grid;
  grid-template-rows: 52px minmax(0, 1fr) auto;
  background: #F7F2EE;
}

.baking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 18px;
  background: #FFFDF9;
}

.baking-logo {
  font: 22px 'Jua', sans-serif;
  color: #8F7C74;
}

.baking-subtitle {
  font-size: 10px;
  letter-spacing: 2px;
  color: #AB9D95;
}

.baking-scene {
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(
    #F7F0F5 0%,
    #F4F5F0 65%,
    #E9D6C9 66%,
    #EBDACA 100%
  );
}

.baking-title {
  padding: 18px 12px 0;
  text-align: center;
}

.baking-title > span {
  font-size: 10px;
  letter-spacing: 2px;
  color: #B3A1A0;
}

.baking-title h1 {
  font: 28px 'Jua', sans-serif;
  color: #87786F;
  margin: 5px 0;
}

.baking-title p {
  margin: 0;
  font-size: 12px;
  color: #A39791;
}

.baking-drop-zone {
  flex: 1;
  min-height: 160px;
  width: min(100%, 480px);
  display: grid;
  place-items: center;
  position: relative;
  padding: 0 12px 27px;
}

.baking-bowl {
  display: block;
  width: min(75%, 280px);
  min-width: 160px;
  filter: drop-shadow(0 8px 9px #8B7B6A25);
}

.bowl-caption {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  white-space: nowrap;
  padding: 7px 16px;
  border-radius: 18px;
  background: #FFFDF5EF;
  box-shadow: 0 4px 14px #9C847015;
}

.bowl-caption strong { font-size: 13px; }
.bowl-caption span { font-size: 10px; }

.baking-receipt {
  width: min(94%, 520px);
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 15px;
  background: #FFFDF6EB;
}

.receipt-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.receipt-heading strong { font-size: 13px; }

.receipt-heading button {
  border: 0;
  background: none;
  color: #A18A7A;
  font-size: 11px;
}

.receipt-heading button:disabled { opacity: .4; }

.baking-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
}

.baking-chip {
  padding: 5px 9px;
  border-radius: 20px;
  background: #F1E7DE;
  font-size: 11px;
}

.empty-message {
  color: #B0A49B;
  font-size: 11px;
}

.baking-dock {
  padding: 12px 14px calc(14px + env(safe-area-inset-bottom));
  background: #FFFAF6;
  border-top: 1px solid #E8DED6;
}

.dock-heading {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
  margin-bottom: 10px;
}

.dock-heading strong {
  font: 18px 'Jua', sans-serif;
}

.dock-heading span {
  font-size: 10px;
  color: #AA9A91;
}

.ingredient-list {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  max-width: 730px;
  margin: auto;
}

.ingredient {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border: 2px solid #ECE3DA;
  border-radius: 14px;
  background: #FFFDF9;
  color: #776B62;
  font-size: 12px;
  user-select: none;
  touch-action: none;
}

.ingredient.selected {
  background: #EFF5EF;
  border-color: #A9BEAD;
}

.ingredient-symbol { font-size: 26px; }

.measure-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 730px;
  margin: 12px auto 0;
}

.measure-cup {
  width: 38px;
  height: 60px;
  flex: 0 0 38px;
  border: 3px solid #C7B9AE;
  border-top: 0;
  border-radius: 2px 2px 10px 10px;
  background: #FFFDF9;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.measure-fill {
  width: 100%;
  border-radius: 5px 5px 0 0;
  transition: height .16s ease;
}

.measure-main { flex: 1; min-width: 0; }

.measure-caption {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.measure-caption strong {
  color: #879D8C;
  font-size: 14px;
}

.measure-main input {
  display: block;
  width: 100%;
  margin: 7px 0;
  accent-color: #9AB3A1;
}

.measure-labels {
  display: flex;
  justify-content: space-between;
  color: #ABA096;
  font-size: 10px;
}

.pour-button,
.egg-controls button {
  border: 0;
  border-radius: 13px;
  background: #A2B7A4;
  color: white;
  padding: 11px 14px;
  font-size: 12px;
  white-space: nowrap;
}

.egg-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  max-width: 730px;
  margin: 14px auto 0;
}

.egg-controls span {
  font-size: 12px;
}

.floating-ingredient {
  position: fixed;
  z-index: 30;
  pointer-events: none;
  transform: translate(-50%, -125%);
  padding: 10px 15px;
  border: 2px solid #A1B7A4;
  border-radius: 20px;
  background: #FFFDF7;
  box-shadow: 0 8px 18px #6E605830;
  font-size: 13px;
}

.egg-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: #53494075;
  display: grid;
  place-items: center;
  padding: 20px;
}

.egg-dialog {
  width: min(100%, 340px);
  background: #FFF9F2;
  border: 5px solid #FFFDF9;
  border-radius: 26px;
  padding: 24px 18px;
  text-align: center;
  box-shadow: 0 18px 45px #41372E30;
}

.egg-eyebrow {
  color: #B4A19B;
  letter-spacing: 2px;
  font-size: 10px;
}

.egg-dialog h2 {
  font: 28px 'Jua', sans-serif;
  color: #87796E;
  margin: 10px 0;
}

.egg-dialog p { font-size: 13px; }

.egg-to-crack {
  position: relative;
  display: block;
  margin: 20px auto;
  padding: 15px 26px;
  border: 0;
  border-radius: 28px;
  background: #F1E8DC;
  font-size: 70px;
  transition: transform .15s ease;
}

.egg-to-crack:active {
  transform: scale(.92) rotate(-5deg);
}

.crack-mark {
  position: absolute;
  top: 12px;
  left: 48%;
  font-size: 45px;
  color: #9D7458;
}

.cancel-egg {
  background: none;
  border: 0;
  color: #A59385;
  font-size: 12px;
  padding: 10px;
}

@media (max-width: 600px) {
  .ingredient-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ingredient {
    flex-direction: row;
    justify-content: center;
    padding: 5px 3px;
    font-size: 11px;
  }

  .ingredient-symbol { font-size: 21px; }
  .baking-title h1 { font-size: 24px; }
  .measure-controls { gap: 8px; }
  .pour-button { padding: 10px; }
  .egg-controls span { font-size: 11px; }
}

@media (max-height: 620px) {
  .baking-title { padding-top: 6px; }
  .baking-title p { display: none; }
  .baking-drop-zone { min-height: 120px; }
  .baking-dock { padding-top: 7px; }
}
`;

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<BakingDemo />);
}
