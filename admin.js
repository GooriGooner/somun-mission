/* 소문의 낙원 — 관리자 페이지 */
(function () {
  "use strict";
  const F = window.Festival;
  const $ = (id) => document.getElementById(id);

  let password = "";
  let rows = [];
  let missions = [];
  let villages = [];
  let sheetUrl = "";
  const filt = { status: "", mission: "", village: "", q: "" };
  const selected = new Set();
  const rejectOpen = new Set();

  $("brandSun").outerHTML = F.doodle("sun");
  $("loginCrown").innerHTML = F.doodle("crown");
  if (F.DEMO) $("demoBar").hidden = false;

  const ss = {
    get() { try { return sessionStorage.getItem("sm-admin") || ""; } catch (e) { return ""; } },
    set(v) { try { v ? sessionStorage.setItem("sm-admin", v) : sessionStorage.removeItem("sm-admin"); } catch (e) { /* 무시 */ } }
  };

  /* ---------- 로그인 ---------- */
  $("loginForm").addEventListener("submit", (e) => { e.preventDefault(); login($("pw").value); });
  async function login(pw, silent) {
    if (!pw) { $("loginErr").textContent = "비밀번호를 입력해주세요."; return; }
    const btn = $("loginBtn");
    btn.disabled = true;
    $("loginErr").textContent = "";
    try {
      await load(pw);
      password = pw;
      ss.set(pw);
      $("loginView").hidden = true;
      $("dashView").hidden = false;
      $("headActions").hidden = false;
    } catch (ex) {
      ss.set("");
      if (!silent) $("loginErr").textContent = ex.message;
    } finally { btn.disabled = false; }
  }
  $("logoutBtn").addEventListener("click", () => {
    ss.set(""); password = ""; rows = [];
    $("dashView").hidden = true; $("headActions").hidden = true; $("loginView").hidden = false;
    $("pw").value = "";
  });
  const saved = ss.get();
  if (saved) login(saved, true);

  /* ---------- 데이터 ---------- */
  async function load(pw) {
    const data = await F.call({ action: "list", password: pw || password });
    rows = (data.rows || []).map(normalize).sort((a, b) => String(b.time).localeCompare(String(a.time)));
    missions = (data.missions || []).filter((m) => m && (m.title || m.locked)).map((m) => ({ ...m, title: m.title || "비공개 미션" }));
    if (!missions.length) missions = [1, 2, 3, 4, 5].map((n) => ({ no: n, title: `${n}주차 미션` }));
    villages = (data.villages || []).filter(Boolean);
    sheetUrl = data.sheetUrl || "";
    $("sheetLink").hidden = !sheetUrl;
    if (sheetUrl) $("sheetLink").href = sheetUrl;
    for (const id of [...selected]) if (!rows.some((r) => r.id === id)) selected.delete(id);
    buildFilterOptions();
    renderAll();
  }
  function normalize(r) {
    return {
      ...r,
      missions: (Array.isArray(r.missions) ? r.missions : String(r.missions || "").split(/[,\s]+/)).map(Number).filter(Boolean),
      photos: r.photos || [],
      status: r.status || "대기"
    };
  }
  $("refreshBtn").addEventListener("click", async () => {
    const b = $("refreshBtn");
    b.disabled = true;
    try { await load(); F.toast("최신 내용으로 바꿨어요"); } catch (ex) { F.toast(ex.message, true); }
    finally { b.disabled = false; }
  });

  function buildFilterOptions() {
    const vs = [...new Set([...villages, ...rows.map((r) => r.village)].filter(Boolean))];
    $("fMission").innerHTML = `<option value="">모든 미션</option>` + missions.map((m) => `<option value="${m.no}">${m.no}주차 · ${F.esc(m.title)}${m.locked ? " (비공개)" : ""}</option>`).join("");
    $("fVillage").innerHTML = `<option value="">모든 마을</option>` + vs.map((v) => `<option>${F.esc(v)}</option>`).join("");
    $("fMission").value = filt.mission;
    $("fVillage").value = filt.village;
  }

  /* ---------- 집계 ---------- */
  const personKey = (r) => `${r.name}|${r.village}|${r.phone4}`;
  function people() {
    const map = new Map();
    rows.forEach((r) => {
      const k = personKey(r);
      if (!map.has(k)) map.set(k, { name: r.name, village: r.village, phone4: r.phone4, count: 0, st: {}, last: r.time });
      const p = map.get(k);
      p.count++;
      if (String(r.time) > String(p.last)) p.last = r.time;
      r.missions.forEach((n) => {
        const cur = p.st[n];
        if (r.status === "승인") p.st[n] = "승인";
        else if (r.status === "대기" && cur !== "승인") p.st[n] = "대기";
        else if (r.status === "반려" && !cur) p.st[n] = "반려";
      });
    });
    return [...map.values()].map((p) => ({ ...p, okN: missions.filter((m) => p.st[m.no] === "승인").length }));
  }

  /* ---------- 그리기 ---------- */
  function renderAll() { renderStats(); renderList(); renderPeople(); renderMissionBars(); }

  function renderStats() {
    const ps = people();
    const c = (s) => rows.filter((r) => r.status === s).length;
    const full = ps.filter((p) => p.okN === missions.length).length;
    const items = [
      ["전체 인증", rows.length], ["확인 대기", c("대기"), true], ["승인", c("승인")],
      ["반려", c("반려")], ["참가자", ps.length], [`${missions.length}개 완주`, full]
    ];
    $("stats").innerHTML = items.map(([k, n, hot]) => `<div class="stat${hot && n ? " hot" : ""}"><div class="n">${n}</div><div class="k">${k}</div></div>`).join("");
    $("statusSeg").querySelectorAll("button").forEach((b) => {
      const s = b.dataset.s;
      const n = s ? c(s) : rows.length;
      b.innerHTML = `${{ "": "전체", "대기": "확인 대기", "승인": "승인", "반려": "반려" }[s]}<span class="c">${n}</span>`;
    });
  }

  function visibleRows() {
    const q = filt.q.trim().toLowerCase();
    return rows.filter((r) =>
      (!filt.status || r.status === filt.status) &&
      (!filt.mission || r.missions.includes(Number(filt.mission))) &&
      (!filt.village || r.village === filt.village) &&
      (!q || [r.name, r.phone4, r.message, r.village].join(" ").toLowerCase().includes(q)));
  }

  function renderList() {
    const vis = visibleRows();
    $("countLine").textContent = `${vis.length}건 보는 중${filt.status || filt.mission || filt.village || filt.q ? ` (전체 ${rows.length}건)` : ""}`;
    if (!vis.length) {
      $("cards").innerHTML = `<div class="empty" style="grid-column:1/-1">${F.doodle("cloud")}${rows.length ? "조건에 맞는 인증이 없어요" : "아직 올라온 인증이 없어요"}</div>`;
    } else {
      $("cards").innerHTML = vis.map(cardHTML).join("");
    }
    const visIds = vis.map((r) => r.id);
    const allOn = visIds.length && visIds.every((id) => selected.has(id));
    $("checkAll").checked = !!allOn;
    $("checkAll").indeterminate = !allOn && visIds.some((id) => selected.has(id));
    $("bulkN").textContent = selected.size ? `${selected.size}건 선택됨` : "";
    $("bulkOk").disabled = $("bulkNo").disabled = !selected.size;
  }

  function cardHTML(r) {
    const mTitle = (n) => (missions.find((m) => m.no === n) || {}).title || "";
    const photos = r.photos.length
      ? `<div class="c-photos">${r.photos.map((p, i) => `<button type="button" data-photo="${r.id}:${i}" aria-label="${F.esc(r.name)} 사진 ${i + 1} 크게 보기"><img src="${F.esc(p.thumb || p.url)}" alt="" loading="lazy" referrerpolicy="no-referrer"></button>`).join("")}</div>`
      : "";
    const actions = rejectOpen.has(r.id)
      ? `<div class="reject-box">
           <input class="input" id="memo-${F.esc(r.id)}" placeholder="반려 이유 (참가자 도장판에 보여요)" maxlength="100" value="${F.esc(r.memo || "")}">
           <div class="row">
             <button class="btn btn-sm btn-no" type="button" data-act="rejectGo" data-id="${F.esc(r.id)}">반려하기</button>
             <button class="btn btn-sm" type="button" data-act="rejectCancel" data-id="${F.esc(r.id)}">취소</button>
           </div>
         </div>`
      : `${r.status !== "승인" ? `<button class="btn btn-sm btn-ok" type="button" data-act="승인" data-id="${F.esc(r.id)}">승인</button>` : ""}
         ${r.status !== "반려" ? `<button class="btn btn-sm btn-no" type="button" data-act="rejectOpen" data-id="${F.esc(r.id)}">반려</button>` : ""}
         ${r.status !== "대기" ? `<button class="btn btn-sm btn-wait" type="button" data-act="대기" data-id="${F.esc(r.id)}">대기로 되돌리기</button>` : ""}`;
    return `
      <article class="card st-${F.esc(r.status)}${selected.has(r.id) ? " sel" : ""}">
        ${photos}
        <div class="c-body">
          <div class="c-top">
            <input type="checkbox" data-sel="${F.esc(r.id)}" ${selected.has(r.id) ? "checked" : ""} aria-label="${F.esc(r.name)} 인증 선택">
            <div class="c-who">
              <div class="c-name">${F.esc(r.name)} <span class="c-meta">· ${F.esc(r.village)} · ${F.esc(r.phone4)}</span></div>
              <div class="c-meta">${F.esc(F.fmtFull(r.time))}${r.reviewedAt ? ` · 처리 ${F.esc(F.fmtTime(r.reviewedAt))}` : ""}</div>
            </div>
            <span class="pill ${F.STATUS_CLASS[r.status] || "wait"}">${F.esc(r.status)}</span>
          </div>
          <div class="c-ms">${r.missions.map((n) => `<span class="mchip" title="${F.esc(mTitle(n))}">${n}주차</span>`).join("")}</div>
          ${r.message ? `<div class="c-msg">${F.esc(r.message)}</div>` : ""}
          ${r.status === "반려" && r.memo ? `<div class="c-memo">반려 이유: ${F.esc(r.memo)}</div>` : ""}
          <div class="c-act">${actions}</div>
        </div>
      </article>`;
  }

  function renderPeople() {
    const ps = people().sort((a, b) => b.okN - a.okN || a.village.localeCompare(b.village, "ko") || a.name.localeCompare(b.name, "ko"));
    const head = `<tr><th>이름</th><th>마을</th><th>뒷자리</th><th class="c">인증 수</th>${missions.map((m) => `<th class="c" title="${F.esc(m.title)}">${m.no}주차${m.locked ? `<br><small style="font-weight:400;opacity:.75">비공개</small>` : ""}</th>`).join("")}<th class="c">승인 미션</th><th>최근 인증</th></tr>`;
    if (!ps.length) { $("peopleTable").innerHTML = `<thead>${head}</thead><tbody><tr><td colspan="${missions.length + 6}" style="text-align:center;padding:30px">아직 참가자가 없어요</td></tr></tbody>`; return; }
    const body = ps.map((p) => {
      const full = p.okN === missions.length;
      return `<tr class="${full ? "full" : ""}">
        <td>${F.esc(p.name)}</td><td>${F.esc(p.village)}</td><td>${F.esc(p.phone4)}</td>
        <td class="c">${p.count}</td>
        ${missions.map((m) => { const s = p.st[m.no]; return s === "승인" ? `<td class="c dot-ok" title="승인">●</td>` : s === "대기" ? `<td class="c dot-wait" title="확인 대기">○</td>` : s === "반려" ? `<td class="c" title="반려" style="color:var(--no)">×</td>` : `<td class="c"></td>`; }).join("")}
        <td class="c">${full ? `<span class="badge-full">완주!</span>` : `${p.okN} / ${missions.length}`}</td>
        <td>${F.esc(F.fmtTime(p.last))}</td></tr>`;
    }).join("");
    $("peopleTable").innerHTML = `<thead>${head}</thead><tbody>${body}</tbody>`;
  }

  function missionStats() {
    return missions.map((m) => {
      const rs = rows.filter((r) => r.missions.includes(m.no));
      const okPeople = new Set(rs.filter((r) => r.status === "승인").map(personKey));
      return { ...m, total: rs.length, ok: rs.filter((r) => r.status === "승인").length, wait: rs.filter((r) => r.status === "대기").length, rej: rs.filter((r) => r.status === "반려").length, okPeople: okPeople.size };
    });
  }
  function renderMissionBars() {
    const st = missionStats();
    const max = Math.max(1, ...st.map((s) => s.total));
    $("missionBars").innerHTML = st.map((s) => `
      <div class="paper mbar">
        <div class="num">${s.no}</div>
        <div style="min-width:0">
          <div class="wk">${s.no}주차 미션${s.locked ? " · 아직 비공개" : ""}</div>
          <div class="mt">${F.esc(s.title)}</div>
          <div class="track" role="img" aria-label="승인 ${s.ok}건, 대기 ${s.wait}건">
            <span class="ok" style="width:${(s.ok / max) * 100}%"></span><span class="wait" style="width:${(s.wait / max) * 100}%"></span>
          </div>
          <div class="nums">인증 ${s.total}건 · 승인 ${s.ok} · 대기 ${s.wait} · 반려 ${s.rej} · 승인받은 사람 ${s.okPeople}명</div>
        </div>
      </div>`).join("");
  }

  /* ---------- 상호작용 ---------- */
  $("statusSeg").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    filt.status = b.dataset.s;
    $("statusSeg").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    renderList();
  });
  $("fMission").addEventListener("change", (e) => { filt.mission = e.target.value; renderList(); });
  $("fVillage").addEventListener("change", (e) => { filt.village = e.target.value; renderList(); });
  let qT;
  $("fSearch").addEventListener("input", (e) => { clearTimeout(qT); qT = setTimeout(() => { filt.q = e.target.value; renderList(); }, 150); });

  document.querySelector(".tabs").addEventListener("click", (e) => {
    const t = e.target.closest(".tab"); if (!t) return;
    document.querySelectorAll(".tab").forEach((x) => { const on = x === t; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); });
    ["list", "people", "missions"].forEach((k) => { $("pane-" + k).hidden = k !== t.dataset.tab; });
  });

  $("checkAll").addEventListener("change", (e) => {
    visibleRows().forEach((r) => (e.target.checked ? selected.add(r.id) : selected.delete(r.id)));
    renderList();
  });

  $("cards").addEventListener("change", (e) => {
    const id = e.target.dataset.sel; if (!id) return;
    e.target.checked ? selected.add(id) : selected.delete(id);
    renderList();
  });

  $("cards").addEventListener("click", async (e) => {
    const ph = e.target.closest("[data-photo]");
    if (ph) { const [id, i] = ph.dataset.photo.split(":"); openPhoto(rows.find((r) => r.id === id).photos[Number(i)]); return; }
    const b = e.target.closest("[data-act]"); if (!b) return;
    const id = b.dataset.id, act = b.dataset.act;
    if (act === "rejectOpen") { rejectOpen.add(id); renderList(); const m = document.getElementById("memo-" + id); if (m) m.focus(); return; }
    if (act === "rejectCancel") { rejectOpen.delete(id); renderList(); return; }
    if (act === "rejectGo") {
      const memo = (document.getElementById("memo-" + id) || {}).value || "";
      await review([id], "반려", memo.trim(), b);
      rejectOpen.delete(id); renderAll(); return;
    }
    await review([id], act, act === "승인" || act === "대기" ? "" : null, b);
    renderAll();
  });

  $("bulkOk").addEventListener("click", async (e) => { await review([...selected], "승인", "", e.currentTarget); selected.clear(); renderAll(); });
  $("bulkNo").addEventListener("click", async (e) => { await review([...selected], "반려", null, e.currentTarget); selected.clear(); renderAll(); });

  async function review(ids, status, memo, btn) {
    if (!ids.length) return;
    if (btn) btn.disabled = true;
    try {
      const res = await F.call({ action: "review", password, ids, status, memo });
      const at = res.reviewedAt || new Date().toISOString();
      rows.forEach((r) => { if (ids.includes(r.id)) { r.status = status; r.reviewedAt = status === "대기" ? "" : at; if (memo != null) r.memo = memo; } });
      F.toast(`${ids.length}건 ${status === "대기" ? "대기로 되돌렸어요" : status + "했어요"}`);
    } catch (ex) {
      F.toast(ex.message, true);
    } finally { if (btn) btn.disabled = false; }
  }

  /* ---------- 사진 크게 보기 ---------- */
  function openPhoto(p) {
    if (!p) return;
    const big = p.id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(p.id)}&sz=w1600` : p.url;
    $("lbImg").src = big;
    $("lbOpen").href = p.url;
    $("lbOpen").hidden = !p.id;
    $("lightbox").hidden = false;
    $("lbClose").focus();
  }
  function closePhoto() { $("lightbox").hidden = true; $("lbImg").removeAttribute("src"); }
  $("lbClose").addEventListener("click", closePhoto);
  $("lightbox").addEventListener("click", (e) => { if (e.target === $("lightbox")) closePhoto(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("lightbox").hidden) closePhoto(); });

  /* ---------- 엑셀 다운로드 ---------- */
  $("exportBtn").addEventListener("click", exportXlsx);
  async function exportXlsx() {
    if (typeof XLSX === "undefined") { F.toast("엑셀 도구를 불러오지 못했어요. 새로고침 후 다시 눌러주세요.", true); return; }
    const link = (p) => (p && p.url && !String(p.url).startsWith("data:") ? p.url : p ? "(예시 사진)" : "");
    const maxPh = Math.max(1, ...rows.map((r) => r.photos.length));
    const mCols = missions.map((m) => `${m.no}주차`);

    const sub = [["제출ID", "제출시각", "이름", "마을", "전화뒷자리", ...mCols, "선택한 미션", "한마디", "상태", "반려 이유", "처리시각", ...Array.from({ length: maxPh }, (_, i) => `사진${i + 1}`)]];
    rows.slice().sort((a, b) => String(a.time).localeCompare(String(b.time))).forEach((r) => {
      sub.push([r.id, F.fmtFull(r.time), r.name, r.village, r.phone4,
        ...missions.map((m) => (r.missions.includes(m.no) ? "O" : "")),
        r.missions.join(", "), r.message || "", r.status, r.memo || "", r.reviewedAt ? F.fmtFull(r.reviewedAt) : "",
        ...Array.from({ length: maxPh }, (_, i) => link(r.photos[i]))]);
    });

    const ps = people().sort((a, b) => a.village.localeCompare(b.village, "ko") || a.name.localeCompare(b.name, "ko"));
    const ppl = [["이름", "마을", "전화뒷자리", "인증 횟수", ...missions.map((m) => `${m.no}주차 ${m.title}`), "승인된 미션 수", "완주", "최근 인증"]];
    ps.forEach((p) => ppl.push([p.name, p.village, p.phone4, p.count, ...missions.map((m) => p.st[m.no] || ""), p.okN, p.okN === missions.length ? "완주" : "", F.fmtFull(p.last)]));

    const ms = [["주차", "미션 이름", "인증 건수", "승인", "확인 대기", "반려", "승인받은 사람 수"]];
    missionStats().forEach((s) => ms.push([s.no, s.title, s.total, s.ok, s.wait, s.rej, s.okPeople]));

    const wb = XLSX.utils.book_new();
    const add = (aoa, name, widths) => {
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = aoa[0].map((h, i) => ({ wch: widths[i] || Math.max(10, String(h).length * 2) }));
      ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: aoa[0].length - 1 } }) };
      XLSX.utils.book_append_sheet(wb, ws, name);
    };
    add(sub, "제출내역", [16, 17, 10, 10, 10, ...missions.map(() => 7), 12, 30, 7, 20, 17, ...Array(maxPh).fill(40)]);
    add(ppl, "참가자별 현황", [10, 10, 10, 9, ...missions.map(() => 16), 13, 7, 17]);
    add(ms, "미션별 현황", [9, 26, 10, 7, 9, 7, 15]);

    const d = new Date();
    const p2 = (n) => String(n).padStart(2, "0");
    const filename = `소문의낙원_미션인증_${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}.xlsx`;

    // Claude 미리보기 안에서는 다운로드 확인창을 통해, 일반 웹에서는 바로 저장
    let dl = null;
    try { if (window.claude && window.claude.use) dl = await window.claude.use("downloads"); } catch (e) { dl = null; }
    if (dl) {
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      try { await dl.save({ filename, data: new Blob([buf]) }); F.toast("엑셀 파일을 저장했어요"); }
      catch (err) { if (err && err.code !== "declined") F.toast("이 화면에서는 저장할 수 없어요.", true); }
      return;
    }
    XLSX.writeFile(wb, filename);
    F.toast("엑셀 파일을 내려받았어요");
  }
})();
