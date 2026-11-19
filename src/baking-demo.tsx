
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createRoot } from "react-dom/client";

type Ingredient = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  kind: "pour" | "egg";
  speed: number;
};

const ingredients: Ingredient[] = [
  { id: "flour", name: "밀가루", emoji: "🌾", color: "#E9D7B8", kind: "pour", speed: 75 },
  { id: "butter", name: "버터", emoji: "🧈", color: "#F4D99E", kind: "pour", speed: 42 },
  { id: "sugar", name: "설탕", emoji: "🍬", color: "#F5E9D8", kind: "pour", speed: 55 },
  { id: "egg", name: "달걀", emoji: "🥚", color: "#E8BD91", kind: "egg", speed: 0 },
  { id: "milk", name: "우유", emoji: "🥛", color: "#D8E7EB", kind: "pour", speed: 105 },
  { id: "cocoa", name: "코코아", emoji: "🍫", color: "#AB836F", kind: "pour", speed: 28 },
];

type DragState = {
  pointerId: number;
  ingredient: Ingredient;
  startX: number;
  startY: number;
  moved: boolean;
  inside: boolean;
  fraction: number;
};

function BakingDemo() {
  const [bowl, setBowl] = useState<Record<string, number>>({});
  const [eggs, setEggs] = useState(0);
  const [selected, setSelected] = useState("flour");
  const [dragging, setDragging] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);
  const [pouring, setPouring] = useState<string | null>(null);
  const [eggDialog, setEggDialog] = useState(false);
  const [eggTaps, setEggTaps] = useState(0);

  const bowlRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);

  // 볼 위에 머무는 시간만큼 양이 쌓여요.
  useEffect(() => {
    let frame = 0;
    let previousTime = performance.now();

    const update = (now: number) => {
      const elapsed = Math.min(now - previousTime, 80);
      previousTime = now;
      const current = dragRef.current;

      if (
        current?.moved &&
        current.inside &&
        current.ingredient.kind === "pour"
      ) {
        current.fraction += current.ingredient.speed * elapsed / 1000;

        const grams = Math.floor(current.fraction);

        if (grams > 0) {
          current.fraction -= grams;
          const id = current.ingredient.id;

          setBowl((old) => ({
            ...old,
            [id]: (old[id] || 0) + grams,
          }));
        }
      }

      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  const itemsInBowl = ingredients.filter((item) =>
    item.kind === "egg"
      ? eggs > 0
      : (bowl[item.id] || 0) > 0
  );

  const total =
    Object.values(bowl).reduce((sum, grams) => sum + grams, 0) +
    eggs * 50;

  const bowlFill = Math.min(1, total / 750);

  function startEgg() {
    setEggTaps(0);
    setEggDialog(true);
  }

  function tapEgg() {
    if (eggTaps === 0) {
      setEggTaps(1);
    } else {
      setEggs((value) => value + 1);
      setEggTaps(0);
      setEggDialog(false);
    }
  }

  function isOverBowl(x: number, y: number) {
    const box = bowlRef.current?.getBoundingClientRect();

    return !!box &&
      x >= box.left &&
      x <= box.right &&
      y >= box.top &&
      y <= box.bottom;
  }

  function onIngredientDown(
    event: PointerEvent<HTMLButtonElement>,
    item: Ingredient
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    setSelected(item.id);

    dragRef.current = {
      pointerId: event.pointerId,
      ingredient: item,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      inside: false,
      fraction: 0,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onIngredientMove(event: PointerEvent<HTMLButtonElement>) {
    const current = dragRef.current;

    if (!current || event.pointerId !== current.pointerId) return;

    if (
      Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY
      ) > 10
    ) {
      current.moved = true;
    }

    if (!current.moved) return;

    current.inside = isOverBowl(event.clientX, event.clientY);

    setDragging({
      name: current.ingredient.name,
      x: event.clientX,
      y: event.clientY,
    });

    setPouring(
      current.inside && current.ingredient.kind === "pour"
        ? current.ingredient.id
        : null
    );
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    const current = dragRef.current;

    if (!current || current.pointerId !== event.pointerId) return;

    if (
      current.ingredient.kind === "egg" &&
      (!current.moved || current.inside)
    ) {
      startEgg();
    }

    dragRef.current = null;
    setDragging(null);
    setPouring(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function cancelDrag() {
    dragRef.current = null;
    setDragging(null);
    setPouring(null);
  }

  return (
    <main className="baking-app">
      <style>{styles}</style>

      <header className="baking-top">
        <span className="baking-logo">little days ♡</span>
        <span className="baking-heading">MY LITTLE KITCHEN</span>
      </header>

      <section className="baking-room">
        <div className="baking-intro">
          <span>A LITTLE BAKING TIME</span>
          <h1>오늘은 무엇을 구워볼까?</h1>
          <p>재료를 직접 잡아서 믹싱볼에 담아봐요.</p>
        </div>

        <div className="baking-bowl-area">
          {pouring && (
            <div className="baking-sprinkles" aria-hidden="true">
              ✦ · · ✧ · ✦
            </div>
          )}

          <svg
            ref={bowlRef}
            className="baking-bowl"
            viewBox="0 0 360 265"
            role="img"
            aria-label="도자기 믹싱볼"
          >
            <ellipse
              cx="180" cy="246" rx="129" ry="13"
              fill="#746A5C" opacity=".12"
            />
            <path
              d="M43 89 Q55 224 180 244 Q305 224 317 89 Z"
              fill="#DCE8E0"
              stroke="#A9BCAF"
              strokeWidth="5"
            />
            <ellipse
              cx="180" cy="89" rx="136" ry="46"
              fill="#FBF8F2"
              stroke="#A9BCAF"
              strokeWidth="5"
            />

            {total > 0 && (
              <ellipse
                cx="180"
                cy="93"
                rx={62 + 56 * bowlFill}
                ry={14 + 21 * bowlFill}
                fill={bowl.cocoa ? "#B79C8A" : "#E8D1B0"}
              />
            )}

            {eggs > 0 && (
              <ellipse
                cx="185" cy="89" rx="21" ry="15"
                fill="#F2C76C"
              />
            )}

            <ellipse
              cx="180" cy="82" rx="136" ry="46"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="5"
            />
          </svg>

          <div className="bowl-status" aria-live="polite">
            <strong>
              {pouring
                ? `${ingredients.find((i) => i.id === pouring)?.name}가 사르르…`
                : total
                  ? "맛있는 반죽을 만드는 중"
                  : "빈 믹싱볼"}
            </strong>
            <span>
              {pouring
                ? "손을 떼면 멈춰요"
                : total
                  ? `${itemsInBowl.length}가지 재료가 담겼어요`
                  : "아래 재료를 여기로 끌어와요"}
            </span>
          </div>
        </div>

        <div className="baking-summary">
          <div className="summary-top">
            <strong>담긴 재료</strong>
            <button
              type="button"
              disabled={total === 0}
              onClick={() => {
                setBowl({});
                setEggs(0);
              }}
            >
              처음부터 다시
            </button>
          </div>

          <div className="summary-items">
            {itemsInBowl.length === 0 ? (
              <span className="summary-empty">
                재료를 넣으면 여기에 나타나요.
              </span>
            ) : (
              itemsInBowl.map((item) => (
                <span className="summary-pill" key={item.id}>
                  {item.name}
                  {item.kind === "egg" ? ` ${eggs}개` : ""}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="baking-pantry">
        <div className="pantry-title">
          <strong>재료 보관함</strong>
          <span>끌어와서 오래 누르면 많이, 짧게 누르면 조금!</span>
        </div>

        <div className="pantry-grid">
          {ingredients.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`pantry-item ${
                selected === item.id ? "selected" : ""
              }`}
              onPointerDown={(event) =>
                onIngredientDown(event, item)
              }
              onPointerMove={onIngredientMove}
              onPointerUp={finishDrag}
              onPointerCancel={cancelDrag}
              onClick={(event) => {
                if (event.detail === 0 && item.kind === "egg") {
                  startEgg();
                }
              }}
            >
              <span className="pantry-emoji">{item.emoji}</span>
              <span className="pantry-name">{item.name}</span>
            </button>
          ))}
        </div>

        <p className="pantry-hint">
          밀가루를 믹싱볼 위로 끌어간 다음 꾹 누르고 있어봐요 ♡
        </p>
      </section>

      {dragging && (
        <div
          className="drag-ingredient"
          style={{ left: dragging.x, top: dragging.y }}
        >
          {dragging.name}
        </div>
      )}

      {eggDialog && (
        <div className="egg-cover">
          <div
            className="egg-popup"
            role="dialog"
            aria-modal="true"
            aria-label="달걀 깨기"
          >
            <span className="egg-eyebrow">CRACK THE EGG</span>
            <h2>달걀을 톡톡!</h2>
            <p>
              {eggTaps
                ? "금이 갔어요! 한 번 더 톡!"
                : "달걀을 두 번 두드려 봐요."}
            </p>

            <button
              className="egg-button"
              type="button"
              onClick={tapEgg}
              aria-label="달걀 두드리기"
            >
              🥚
              {eggTaps ? <span className="egg-crack">⌁</span> : null}
            </button>

            <button
              className="egg-close"
              type="button"
              onClick={() => setEggDialog(false)}
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
html, body, #root { width: 100%; height: 100%; margin: 0; }

body {
  background: #F6F0EC;
  color: #766C63;
  font-family: 'Gowun Dodum', sans-serif;
  min-width: 0;
}

button { font: inherit; cursor: pointer; }
#root { max-width: none; padding: 0; text-align: left; }

.baking-app {
  height: 100dvh;
  display: grid;
  grid-template-rows: 54px minmax(0, 1fr) auto;
  overflow: hidden;
  background: #F7F3EF;
}

.baking-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #FFFDF8;
}

.baking-logo {
  font: 21px 'Jua', sans-serif;
  color: #89786B;
}

.baking-heading {
  font-size: 10px;
  color: #A99B91;
  letter-spacing: 1.6px;
}

.baking-room {
  min-height: 0;
  display: flex;
  align-items: center;
  flex-direction: column;
  overflow-y: auto;
  background: linear-gradient(
    #F5EEF8,
    #F7F8F3 65%,
    #EADBCF 66%,
    #E9D9C9
  );
}

.baking-intro {
  padding: 20px 12px 0;
  text-align: center;
}

.baking-intro span {
  font-size: 10px;
  letter-spacing: 2px;
  color: #B39F9C;
}

.baking-intro h1 {
  font: 28px 'Jua', sans-serif;
  margin: 7px 0;
  color: #867A71;
}

.baking-intro p {
  margin: 0;
  font-size: 12px;
  color: #9F958B;
}

.baking-bowl-area {
  flex: 1;
  min-height: 170px;
  width: min(100%, 450px);
  position: relative;
  display: grid;
  place-items: center;
  padding: 0 13px 26px;
}

.baking-bowl {
  width: min(78%, 300px);
  min-width: 160px;
  display: block;
  filter: drop-shadow(0 7px 9px #77685822);
}

.baking-sprinkles {
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 22%;
  transform: translateX(-50%);
  font-size: 21px;
  color: #B49A74;
  pointer-events: none;
  animation: sprinkle .65s ease-in-out infinite alternate;
}

@keyframes sprinkle {
  from {
    opacity: .45;
    transform: translate(-50%, -6px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 15px);
  }
}

.bowl-status {
  position: absolute;
  left: 50%;
  bottom: 7px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 15px;
  border-radius: 17px;
  background: #FFFDF5F0;
  white-space: nowrap;
  box-shadow: 0 4px 12px #947D6E1E;
}

.bowl-status strong { font-size: 13px; }
.bowl-status span { font-size: 10px; }

.baking-summary {
  flex: none;
  width: min(94%, 540px);
  margin: 0 0 13px;
  padding: 11px 13px;
  border-radius: 15px;
  background: #FFFDF5EE;
}

.summary-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.summary-top strong { font-size: 13px; }

.summary-top button {
  font-size: 11px;
  color: #9F887B;
  background: none;
  border: 0;
}

.summary-top button:disabled { opacity: .35; }

.summary-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 7px;
}

.summary-pill {
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 16px;
  background: #F0E6DD;
}

.summary-empty {
  color: #AFA39B;
  font-size: 11px;
}

.baking-pantry {
  background: #FFF9F5;
  padding: 12px 14px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid #E8DED4;
}

.pantry-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.pantry-title strong {
  font: 18px 'Jua', sans-serif;
}

.pantry-title span {
  font-size: 10px;
  color: #A9988E;
}

.pantry-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 9px;
  max-width: 730px;
  margin: auto;
}

.pantry-item {
  border: 2px solid #EDE4DA;
  border-radius: 14px;
  background: #FFFDF9;
  color: #776B62;
  min-width: 0;
  padding: 8px 2px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  touch-action: none;
  user-select: none;
}

.pantry-item.selected {
  border-color: #A9BEAD;
  background: #F1F7F0;
}

.pantry-emoji {
  font-size: 26px;
  line-height: 1.1;
}

.pantry-name { font-size: 12px; }

.pantry-hint {
  margin: 9px 0 0;
  text-align: center;
  color: #AA9D94;
  font-size: 11px;
}

.drag-ingredient {
  position: fixed;
  z-index: 20;
  transform: translate(-50%, -125%);
  pointer-events: none;
  background: #FFFDF7;
  border: 2px solid #ACBFAC;
  border-radius: 18px;
  padding: 10px 14px;
  font-size: 13px;
  box-shadow: 0 8px 20px #63594F28;
}

.egg-cover {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  background: #52463A72;
  padding: 18px;
}

.egg-popup {
  width: min(100%, 340px);
  padding: 26px 20px;
  background: #FFF9F2;
  border: 5px solid white;
  border-radius: 28px;
  text-align: center;
  box-shadow: 0 12px 35px #3F342F32;
}

.egg-eyebrow {
  color: #B7A29A;
  font-size: 10px;
  letter-spacing: 2px;
}

.egg-popup h2 {
  margin: 10px 0;
  color: #87776D;
  font: 29px 'Jua', sans-serif;
}

.egg-popup p { font-size: 13px; }

.egg-button {
  position: relative;
  display: block;
  border: 0;
  border-radius: 26px;
  background: #F1E5D8;
  padding: 18px 29px;
  font-size: 68px;
  margin: 22px auto;
}

.egg-button:active { transform: scale(.94); }

.egg-crack {
  position: absolute;
  color: #97775D;
  top: 10px;
  left: 45%;
}

.egg-close {
  background: none;
  border: none;
  font-size: 12px;
  color: #A89585;
}

@media (max-width: 600px) {
  .pantry-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }

  .pantry-item {
    flex-direction: row;
    padding: 6px 3px;
  }

  .pantry-emoji { font-size: 21px; }
  .pantry-name { font-size: 11px; }
  .baking-intro h1 { font-size: 24px; }

  .pantry-title span {
    max-width: 65%;
    text-align: right;
  }
}

@media (max-height: 600px) {
  .baking-intro { padding-top: 7px; }
  .baking-intro p { display: none; }
  .baking-bowl-area { min-height: 128px; }
  .baking-pantry { padding-top: 7px; }
  .pantry-hint { display: none; }
}
`;

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(<BakingDemo />);
}
