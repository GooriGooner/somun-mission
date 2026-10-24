/* 소문의 낙원 — 공용 스크립트 (API, 낙서, 유틸) */
(function () {
  "use strict";
  const CFG = window.FESTIVAL_CONFIG || {};
  const DEMO = !CFG.API_URL;

  /* ---------- 손그림 낙서 (포스터의 노란 마커 그림) ---------- */
  const S = 'fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
  const DOODLES = {
    sun: `<svg viewBox="0 0 100 100"><path ${S} d="M50 34c-9 0-15 7-15 15s6 15 15 15 15-7 15-15c0-6-4-11-10-11s-9 4-9 8 3 6 6 6"/><path ${S} d="M50 6v12M50 82v12M10 50h12M78 50h12M20 20l8 8M72 72l8 8M80 20l-8 8M28 72l-8 8"/></svg>`,
    cloud: `<svg viewBox="0 0 120 70"><path ${S} d="M20 56c-10 0-14-8-11-15 3-6 10-8 15-5 1-11 10-18 20-16 4-9 16-12 25-6 7-6 19-4 23 5 9-1 17 6 15 15-1 8-8 12-15 11-3 8-12 12-20 8-7 6-18 6-24 0-8 5-20 5-28 3z"/><path ${S} d="M40 44q4 4 8 0M62 46q4 4 8 0"/></svg>`,
    tulip: `<svg viewBox="0 0 70 110"><path ${S} d="M20 14l8 12 7-16 7 16 8-12v18c0 11-7 18-15 18s-15-7-15-18z"/><path ${S} d="M35 50v52"/><path ${S} d="M35 92c8-12 20-14 27-10-3 10-14 14-27 10z"/></svg>`,
    crown: `<svg viewBox="0 0 80 60"><path ${S} d="M10 46 6 14l20 16 14-22 14 22 20-16-4 32z"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" d="M4 12.5l5 5L20 6"/></svg>`,
    camera: `<svg viewBox="0 0 64 52"><path ${S} d="M6 16c0-3 2-5 5-5h9l5-7h14l5 7h9c3 0 5 2 5 5v26c0 3-2 5-5 5H11c-3 0-5-2-5-5z"/><circle ${S} cx="32" cy="29" r="10"/></svg>`,
    lock: `<svg viewBox="0 0 48 56"><rect ${S} x="7" y="24" width="34" height="26" rx="5"/><path ${S} d="M14 24v-7a10 10 0 0 1 20 0v7"/><path ${S} d="M24 34v6"/></svg>`,
    bird: `<svg viewBox="0 0 110 60"><path ${S} d="M8 30c14-14 36-18 52-10 10-8 26-10 42-4-10 4-16 10-18 16 8 2 14 8 16 14-14-2-24-4-30-8-14 10-38 8-62-8z"/><circle cx="34" cy="28" r="4" fill="currentColor"/></svg>`
  };
  function doodle(name, cls) {
    return `<span class="doodle ${cls || ""}" aria-hidden="true">${DOODLES[name] || ""}</span>`;
  }


  /* "참 잘했어요" 도장 — 가운데 엄지척 하는 양 */
  function stampSVG() {
    const P = "#fffce9";
    const wool = [[78,100,16],[98,92,17],[118,98,16],[126,116,15],[116,132,15],[96,136,16],[76,130,15],[70,114,14],[98,114,26]]
      .map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor"/>`).join("");
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
  <defs>
    <filter id="stInk" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -9 6.9" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in"/>
    </filter>
    <path id="stArcTop" d="M 38 100 A 62 62 0 0 1 162 100"/>
    <path id="stArcBot" d="M 30 100 A 70 70 0 0 0 170 100"/>
  </defs>
  <g filter="url(#stInk)">
    <circle cx="100" cy="100" r="93" fill="none" stroke="currentColor" stroke-width="7"/>
    <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" stroke-width="2"/>
    <text class="st-top" fill="currentColor" text-anchor="middle"><textPath href="#stArcTop" startOffset="50%" textLength="148" lengthAdjust="spacingAndGlyphs">참 잘했어요</textPath></text>
    <text class="st-bot" fill="currentColor" text-anchor="middle"><textPath href="#stArcBot" startOffset="50%" textLength="112" lengthAdjust="spacingAndGlyphs">소문의 낙원 · 11.29</textPath></text>
    <!-- 양 -->
    ${wool}
    <rect x="85" y="146" width="7" height="12" rx="3" fill="currentColor"/>
    <rect x="104" y="146" width="7" height="12" rx="3" fill="currentColor"/>
    <ellipse cx="76" cy="105" rx="10" ry="5" transform="rotate(-28 76 105)" fill="${P}" stroke="currentColor" stroke-width="3"/>
    <ellipse cx="120" cy="105" rx="10" ry="5" transform="rotate(28 120 105)" fill="${P}" stroke="currentColor" stroke-width="3"/>
    <ellipse cx="98" cy="112" rx="17" ry="20" fill="${P}" stroke="currentColor" stroke-width="3"/>
    <circle cx="91" cy="94" r="6" fill="currentColor"/><circle cx="99" cy="91" r="6.5" fill="currentColor"/><circle cx="107" cy="94" r="6" fill="currentColor"/>
    <path d="M88 110q3.5-4.5 7 0M101 110q3.5-4.5 7 0" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="87" cy="118" r="3" fill="currentColor" opacity=".35"/><circle cx="109" cy="118" r="3" fill="currentColor" opacity=".35"/>
    <path d="M92 120q6 6 12 0" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <!-- 엄지척 -->
    <path d="M122 124l9-5" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
    <path d="M136 108v-13a4.5 4.5 0 0 1 9 0v13" fill="${P}" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <rect x="129" y="107" width="22" height="20" rx="6" fill="${P}" stroke="currentColor" stroke-width="3"/>
    <path d="M131 114h18M131 120h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M162 112l2.2 5.8 5.8 2.2-5.8 2.2-2.2 5.8-2.2-5.8-5.8-2.2 5.8-2.2z" fill="currentColor"/>
    <path d="M157 94l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" fill="currentColor"/>
  </g>
</svg>`;
  }

  /* ---------- 유틸 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function fmtTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return String(iso || "");
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function fmtFull(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return String(iso || "");
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  let toastTimer;
  function toast(msg, bad) {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.toggle("bad", !!bad);
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }
  const STATUS_CLASS = { "승인": "ok", "대기": "wait", "반려": "no" };

  /* 사진을 최대 1600px JPEG로 줄여서 dataURL로 */
  function shrinkImage(file, max = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("사진을 읽지 못했어요."));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width: w, height: h } = img;
          const r = Math.min(1, max / Math.max(w, h));
          w = Math.round(w * r); h = Math.round(h * r);
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("이 사진 형식은 열 수 없어요. JPG나 PNG로 다시 골라주세요."));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- 미리보기용 예시 데이터 ---------- */
  function demoPhoto(hue, label) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="hsl(${hue},38%,42%)"/><g fill="none" stroke="#fff35e" stroke-width="10" stroke-linecap="round"><path d="M80 300c40-60 90-60 120 0s90 40 130-20"/><circle cx="300" cy="110" r="36"/></g><text x="200" y="215" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="700" fill="#fff35e">${label}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  const DEMO_CONFIG = {
    missions: [
      { no: 1, title: "태신자 품고 기도한 뒤 태신자 카드 작성하기", desc: "", locked: false },
      { no: 2, title: "", desc: "", locked: true },
      { no: 3, title: "", desc: "", locked: true },
      { no: 4, title: "", desc: "", locked: true },
      { no: 5, title: "", desc: "", locked: true }
    ],
    villages: ["믿음", "소망", "사랑", "운영위원회", "새가족(웰컴팀)"]
  };
  const now = Date.now();
  const H = 3600e3;
  const demoRows = [
    ["김하늘", "믿음", "1234", [1], "회사 동기 두 명 품고 기도했어요", "승인", 2],
    ["이도윤", "소망", "5821", [1], "", "대기", 5],
    ["박서진", "사랑", "0417", [1], "카드 세 장 썼어요", "대기", 8],
    ["최예린", "믿음", "7730", [1], "", "반려", 20],
    ["정민준", "운영위원회", "3102", [1], "", "승인", 30],
    ["한유나", "새가족(웰컴팀)", "9088", [1], "웰컴팀 다 같이!", "승인", 49],
    ["오지후", "사랑", "2266", [1], "", "대기", 51]
  ].map((r, i) => ({
    id: "DEMO" + (101 + i),
    time: new Date(now - r[6] * H).toISOString(),
    name: r[0], village: r[1], phone4: r[2], missions: r[3], message: r[4], status: r[5],
    memo: r[5] === "반려" ? "태신자 카드가 사진에 안 보여요" : "",
    reviewedAt: r[5] !== "대기" ? new Date(now - (r[6] - 1) * H).toISOString() : "",
    photos: Array.from({ length: 1 + (i % 3) }, (_, k) => {
      const u = demoPhoto((i * 47 + k * 90) % 360, "예시 사진");
      return { id: "", url: u, thumb: u };
    })
  }));

  /* ---------- API ---------- */
  async function call(payload) {
    if (DEMO) return demoCall(payload);
    const res = await fetch(CFG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });
    if (!res.ok) throw new Error("서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.");
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "요청을 처리하지 못했어요.");
    return data;
  }

  function demoCall(p) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        switch (p.action) {
          case "config":
            return resolve({ ok: true, ...DEMO_CONFIG });
          case "submit": {
            const closed = DEMO_CONFIG.missions.filter((m) => m.locked).map((m) => m.no);
            if (p.missions.some((n) => closed.includes(n))) return reject(new Error("아직 공개되지 않은 미션이 들어 있어요."));
            const row = {
              id: "DEMO" + (200 + demoRows.length), time: new Date().toISOString(),
              name: p.name, village: p.village, phone4: p.phone4, missions: p.missions.slice(),
              message: p.message || "", status: "승인", memo: "", reviewedAt: new Date().toISOString(),
              photos: (p.photos || []).map((x) => ({ id: "", url: x.data, thumb: x.data }))
            };
            demoRows.unshift(row);
            return resolve({ ok: true, id: row.id });
          }
          case "my": {
            const rows = demoRows.filter((r) => r.name === p.name.trim() && r.phone4 === p.phone4);
            return resolve({ ok: true, records: rows.map((r) => ({ time: r.time, missions: r.missions, status: r.status, memo: r.memo })) });
          }
          case "list":
            if (p.password !== "demo") return reject(new Error("비밀번호가 맞지 않아요. (미리보기 비밀번호: demo)"));
            return resolve({ ok: true, rows: JSON.parse(JSON.stringify(demoRows)), sheetUrl: "", missions: DEMO_CONFIG.missions.map((m) => ({ ...m, title: m.title || `${m.no}주차 미션 (미정)` })), villages: DEMO_CONFIG.villages });
          case "review": {
            if (p.password !== "demo") return reject(new Error("비밀번호가 맞지 않아요."));
            const at = new Date().toISOString();
            demoRows.forEach((r) => {
              if (p.ids.includes(r.id)) { r.status = p.status; r.reviewedAt = at; if (p.memo != null) r.memo = p.memo; }
            });
            return resolve({ ok: true, reviewedAt: at });
          }
          default:
            return reject(new Error("알 수 없는 요청이에요."));
        }
      }, 350);
    });
  }

  window.Festival = { CFG, DEMO, doodle, stampSVG, esc, fmtTime, fmtFull, toast, shrinkImage, call, STATUS_CLASS };
})();
