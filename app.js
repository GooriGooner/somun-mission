/* 소문의 낙원 — 참가자 인증 페이지 */
(function () {
  "use strict";
  const F = window.Festival;
  const $ = (id) => document.getElementById(id);
  const MAX = Number(F.CFG.MAX_PHOTOS) || 3;

  let missions = [];
  let photos = []; // {data, busy}
  let picked = new Set();

  /* ---------- 장식 ---------- */
  $("d-sun").outerHTML = F.doodle("sun");
  $("d-crown").outerHTML = F.doodle("crown");
  $("footDoodles").innerHTML = F.doodle("cloud") + F.doodle("tulip") + F.doodle("sun") + F.doodle("tulip") + F.doodle("bird");
  if (F.DEMO) $("demoBar").hidden = false;
  $("photoMax").textContent = `최대 ${MAX}장`;

  // D-day
  (function () {
    const ev = new Date((F.CFG.EVENT_DATE || "2026-11-29") + "T00:00:00");
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const diff = Math.round((ev - t) / 864e5);
    const label = diff > 0 ? `D-${diff}` : diff === 0 ? "D-DAY" : "축제 끝!";
    $("dday").innerHTML = `<b>11.29</b> ${label}`;
  })();

  /* ---------- 이전 입력 기억 (이 기기에서만) ---------- */
  const store = {
    get() { try { return JSON.parse(localStorage.getItem("sm-me") || "{}"); } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem("sm-me", JSON.stringify(v)); } catch (e) { /* 무시 */ } }
  };
  const me = store.get();
  if (me.name) { $("name").value = me.name; $("myName").value = me.name; }
  if (me.phone4) { $("phone4").value = me.phone4; $("myPhone").value = me.phone4; }

  /* ---------- 설정 불러오기 ---------- */
  F.call({ action: "config" }).then((cfg) => {
    missions = (cfg.missions || []).filter((m) => m && (m.title || m.locked));
    renderMissions();
    const villages = (cfg.villages || []).filter(Boolean);
    const sel = $("village");
    if (villages.length) {
      sel.innerHTML = `<option value="">마을 선택</option>` +
        villages.map((v) => `<option>${F.esc(v)}</option>`).join("");
      if (me.village && villages.includes(me.village)) sel.value = me.village;
    } else {
      sel.hidden = true;
      $("villageText").hidden = false;
      if (me.village) $("villageText").value = me.village;
    }
  }).catch((e) => {
    $("missions").innerHTML = `<p class="err-msg">${F.esc(e.message)} 새로고침해주세요.</p>`;
    $("village").innerHTML = `<option value="">불러오지 못했어요</option>`;
  });

  $("village").addEventListener("change", (e) => {
    const etc = e.target.value === "__etc";
    $("villageText").hidden = !etc;
    if (etc) $("villageText").focus();
  });

  /* ---------- 미션 ---------- */
  function renderMissions() {
    if (!missions.length) {
      $("missions").innerHTML = `<p class="hint">아직 등록된 미션이 없어요.</p>`;
      return;
    }
    $("missions").innerHTML = missions.map((m) => m.locked ? `
      <div class="mission locked" aria-disabled="true">
        <span class="num">${m.no}</span>
        <span class="txt"><span class="wk">${m.no}주차 미션</span><span class="mt">아직 비공개예요</span><span class="md" style="display:block">공개되면 여기서 바로 인증할 수 있어요</span></span>
        <span class="chk">${F.doodle("lock")}</span>
      </div>` : `
      <label class="mission${picked.has(m.no) ? " on" : ""}" data-no="${m.no}">
        <input type="checkbox" value="${m.no}" ${picked.has(m.no) ? "checked" : ""}>
        <span class="num">${m.no}</span>
        <span class="txt"><span class="wk">${m.no}주차 미션</span><span class="mt">${F.esc(m.title)}</span>${m.desc ? `<span class="md" style="display:block">${F.esc(m.desc)}</span>` : ""}</span>
        <span class="chk">${F.doodle("check")}</span>
      </label>`).join("");
    updatePicked();
  }
  $("missions").addEventListener("change", (e) => {
    const cb = e.target;
    if (cb.type !== "checkbox") return;
    const no = Number(cb.value);
    cb.checked ? picked.add(no) : picked.delete(no);
    cb.closest(".mission").classList.toggle("on", cb.checked);
    updatePicked();
  });
  function updatePicked() {
    $("pickedCount").textContent = picked.size ? `${[...picked].sort((a, b) => a - b).map((n) => n + "주차").join(", ")} 미션 선택` : "";
  }

  /* ---------- 사진 ---------- */
  function renderPhotos() {
    const html = photos.map((p, i) => `
      <div class="slot filled">
        ${p.data ? `<img src="${p.data}" alt="인증 사진 ${i + 1}">` : ""}
        ${p.busy ? `<div class="busy"><span class="spin"></span></div>` : `<button class="x" type="button" data-i="${i}" aria-label="사진 ${i + 1} 빼기">×</button>`}
      </div>`);
    if (photos.length < MAX) {
      html.push(`<button type="button" class="slot add" id="addPhoto">${'<span>' + F.doodle("camera") + "</span>"}<span>${photos.length ? "사진 더 추가" : "사진 고르기"}</span></button>`);
    }
    $("photos").innerHTML = html.join("");
  }
  $("photos").addEventListener("click", (e) => {
    const x = e.target.closest(".x");
    if (x) { photos.splice(Number(x.dataset.i), 1); renderPhotos(); return; }
    if (e.target.closest("#addPhoto")) $("fileInput").click();
  });
  $("fileInput").addEventListener("change", async (e) => {
    const files = [...e.target.files].slice(0, MAX - photos.length);
    e.target.value = "";
    if (!files.length) return;
    const slots = files.map(() => ({ data: "", busy: true }));
    photos.push(...slots);
    renderPhotos();
    for (let i = 0; i < files.length; i++) {
      try {
        slots[i].data = await F.shrinkImage(files[i]);
        slots[i].busy = false;
      } catch (err) {
        photos.splice(photos.indexOf(slots[i]), 1);
        F.toast(err.message, true);
      }
      renderPhotos();
    }
  });
  renderPhotos();

  /* ---------- 제출 ---------- */
  function villageValue() {
    const sel = $("village");
    if (sel.hidden || sel.value === "__etc") return $("villageText").value.trim();
    return sel.value;
  }
  $("phone4").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); });
  $("myPhone").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); });

  $("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("formErr");
    err.textContent = "";
    const name = $("name").value.trim();
    const village = villageValue();
    const phone4 = $("phone4").value.trim();
    const problems = [];
    if (!name) problems.push("이름");
    if (!village) problems.push("소속 마을");
    if (!/^\d{4}$/.test(phone4)) problems.push("전화번호 뒷자리 4자리");
    if (!picked.size) problems.push("미션 (1개 이상)");
    if (!photos.length) problems.push("인증 사진 (1장 이상)");
    if (problems.length) { err.textContent = `${problems.join(", ")}을(를) 채워주세요.`; return; }
    if (photos.some((p) => p.busy)) { err.textContent = "사진을 준비하고 있어요. 잠깐만 기다려주세요."; return; }

    const btn = $("submitBtn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spin"></span> 올리는 중…`;
    const ms = [...picked].sort((a, b) => a - b);
    try {
      await F.call({
        action: "submit", name, village, phone4, missions: ms,
        message: $("message").value.trim(),
        photos: photos.map((p, i) => ({ name: `photo${i + 1}.jpg`, data: p.data }))
      });
      store.set({ name, village, phone4 });
      $("myName").value = name; $("myPhone").value = phone4;
      $("doneTitle").textContent = `${name}님, 소문이 퍼지고 있어요!`;
      $("doneText").textContent = "관리자가 확인하면 승인 도장이 찍혀요. 아래 도장판에서 확인할 수 있어요.";
      $("doneStamps").innerHTML = ms.map((n) => `<span class="mchip">${n}주차</span>`).join("");
      $("form").hidden = true;
      $("done").hidden = false;
      $("done").scrollIntoView({ behavior: "smooth", block: "center" });
      picked = new Set(); photos = [];
      $("message").value = "";
      renderMissions(); renderPhotos();
    } catch (ex) {
      err.textContent = ex.message || "올리지 못했어요. 다시 시도해주세요.";
    } finally {
      btn.disabled = false;
      btn.textContent = "인증 올리기";
    }
  });

  $("againBtn").addEventListener("click", () => {
    $("done").hidden = true;
    $("form").hidden = false;
    $("form").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- 내 도장판 ---------- */
  $("myForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("myName").value.trim();
    const phone4 = $("myPhone").value.trim();
    const out = $("myResult");
    if (!name || !/^\d{4}$/.test(phone4)) { out.innerHTML = `<p class="err-msg">이름과 뒷자리 4자리를 입력해주세요.</p>`; return; }
    const btn = $("myBtn");
    btn.disabled = true;
    out.innerHTML = `<p class="hint"><span class="spin"></span> 찾는 중…</p>`;
    try {
      const { records = [] } = await F.call({ action: "my", name, phone4 });
      out.innerHTML = renderBoard(records);
    } catch (ex) {
      out.innerHTML = `<p class="err-msg">${F.esc(ex.message)}</p>`;
    } finally { btn.disabled = false; }
  });

  function renderBoard(records) {
    const total = missions.length ? missions.map((m) => m.no) : [1, 2, 3, 4, 5];
    if (!records.length) return `<p class="hint" style="margin-top:4px">아직 인증 기록이 없어요. 위에서 첫 미션을 올려보세요!</p>`;
    const state = {};
    records.forEach((r) => (r.missions || []).forEach((n) => {
      if (r.status === "승인") state[n] = "ok";
      else if (r.status === "대기" && state[n] !== "ok") state[n] = "wait";
    }));
    const okCount = total.filter((n) => state[n] === "ok").length;
    const cells = total.map((n) => {
      const s = state[n];
      const lk = (missions.find((m) => m.no === n) || {}).locked;
      return `<div class="cell ${s || (lk ? "locked" : "")}" title="${n}주차 미션${lk ? " (비공개)" : ""}">${lk && !s ? F.doodle("lock") : `${n}<small>주차</small>`}${s === "ok" ? `<span class="tag">승인</span>` : s === "wait" ? `<span class="tag">확인 중</span>` : ""}</div>`;
    }).join("");
    const list = records.slice().sort((a, b) => String(b.time).localeCompare(String(a.time))).map((r) => `
      <div class="my-item">
        <span class="when">${F.esc(F.fmtTime(r.time))}</span>
        ${(r.missions || []).map((n) => `<span class="mchip">${n}주차</span>`).join("")}
        <span class="pill ${F.STATUS_CLASS[r.status] || "wait"}">${F.esc(r.status)}</span>
        ${r.status === "반려" && r.memo ? `<span class="hint">· ${F.esc(r.memo)}</span>` : ""}
      </div>`).join("");
    return `
      <div style="font-family:var(--font-hand);font-size:24px;font-weight:700;margin:4px 0 10px">승인된 미션 ${okCount} / ${total.length}${okCount === total.length ? " · 완주!" : ""}</div>
      <div class="board">${cells}</div>
      <div class="my-list">${list}</div>`;
  }
})();
