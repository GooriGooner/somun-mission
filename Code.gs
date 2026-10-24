/**
 * 소문의 낙원 미션 인증 — 구글 Apps Script 백엔드
 * ------------------------------------------------------------
 * 이 코드는 "구글 스프레드시트 → 확장 프로그램 → Apps Script"에 붙여넣어 사용해요.
 * 1) 아래 ADMIN_PASSWORD를 원하는 비밀번호로 바꾸세요.
 * 2) 위쪽 함수 선택에서 setup 을 고르고 [실행] → 권한 허용 (한 번만)
 * 3) [배포] → [새 배포] → 유형: 웹 앱
 *      - 다음 사용자 인증 정보로 실행: 나
 *      - 액세스 권한이 있는 사용자: 모든 사용자
 *    → 나오는 웹 앱 URL을 사이트의 config.js API_URL에 붙여넣기
 * 코드를 고친 뒤에는 [배포 관리] → 연필 → 버전: 새 버전 으로 다시 배포해야 반영돼요.
 */

const ADMIN_PASSWORD = '여기를-바꾸세요';   // 관리자 페이지 비밀번호
const MAX_MISSIONS = 5;                     // 미션 개수 (1~5)
const MAX_PHOTOS = 3;                       // 한 번에 올릴 수 있는 사진 수
const FOLDER_NAME = '소문의 낙원 미션 인증 사진';

const SHEET_SUB = '제출내역';
const SHEET_SET = '설정';
const HEAD = ['제출ID', '제출시각', '이름', '마을', '전화뒷자리', '선택미션']
  .concat(Array.from({ length: MAX_MISSIONS }, (_, i) => (i + 1) + '주차'))
  .concat(['한마디', '상태', '반려이유', '처리시각', '사진ID'])
  .concat(Array.from({ length: MAX_PHOTOS }, (_, i) => '사진링크' + (i + 1)));
const COL = {};
HEAD.forEach((h, i) => (COL[h] = i)); // 0부터 시작하는 열 번호

/* ============ 처음 한 번 실행 ============ */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone('Asia/Seoul');
  ensureSheets_();
  getFolder_();
  Logger.log('준비 완료! 이제 [배포] → [새 배포] → 웹 앱으로 배포하세요.');
}

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sub = ss.getSheetByName(SHEET_SUB);
  if (!sub) {
    sub = ss.insertSheet(SHEET_SUB, 0);
    sub.getRange(1, 1, 1, HEAD.length).setValues([HEAD])
      .setFontWeight('bold').setBackground('#22301a').setFontColor('#fff35e');
    sub.setFrozenRows(1);
    sub.getRange(2, COL['전화뒷자리'] + 1, sub.getMaxRows() - 1, 1).setNumberFormat('@');
    sub.getRange(2, COL['선택미션'] + 1, sub.getMaxRows() - 1, 1).setNumberFormat('@');
    sub.setColumnWidth(COL['제출시각'] + 1, 140);
    sub.setColumnWidth(COL['한마디'] + 1, 220);
    const st = sub.getRange(2, COL['상태'] + 1, sub.getMaxRows() - 1, 1);
    sub.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('승인').setBackground('#dff0d6').setFontColor('#2f7d3a').setRanges([st]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('대기').setBackground('#fff1bf').setFontColor('#9a6b00').setRanges([st]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('반려').setBackground('#fbe1d6').setFontColor('#c4471f').setRanges([st]).build()
    ]);
  }
  let set = ss.getSheetByName(SHEET_SET);
  if (!set) {
    set = ss.insertSheet(SHEET_SET);
    const rows = [['주차', '미션이름', '설명(선택)', '공개여부', '마을 목록']];
    rows.push([1, '태신자 품고 기도한 뒤 태신자 카드 작성하기', '', '공개', '']);
    for (let i = 2; i <= MAX_MISSIONS; i++) rows.push([i, '', '', '비공개', '']);
    set.getRange(1, 1, rows.length, 5).setValues(rows);
    const vill = [['믿음'], ['소망'], ['사랑'], ['운영위원회'], ['새가족(웰컴팀)']];
    set.getRange(2, 5, vill.length, 1).setValues(vill);
    set.getRange(2, 4, MAX_MISSIONS, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(['공개', '비공개'], true).build());
    set.getRange(1, 7).setValue('※ 공개여부를 "공개"로 바꾸면 그 주차 미션이 사이트에 바로 열려요. 미션이름은 비공개여도 미리 적어둘 수 있어요(참가자에게는 안 보임).');
    set.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#fff35e');
    set.setColumnWidth(2, 260); set.setColumnWidth(3, 320); set.setColumnWidth(5, 140);
    set.setFrozenRows(1);
  }
  const blank = ss.getSheetByName('시트1') || ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 2) ss.deleteSheet(blank);
  return { sub, set };
}

function getFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* 지워졌으면 새로 만듦 */ }
  }
  const folder = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

/* ============ 웹 앱 입구 ============ */
function doGet() {
  return json_({ ok: true, message: '소문의 낙원 미션 인증 서버가 작동 중이에요.' });
}

function doPost(e) {
  try {
    const p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (p.action) {
      case 'config': return json_(Object.assign({ ok: true }, readConfig_()));
      case 'submit': return json_(submit_(p));
      case 'my': return json_(my_(p));
      case 'list': checkPw_(p.password); return json_(list_());
      case 'review': checkPw_(p.password); return json_(review_(p));
      default: return json_({ ok: false, error: '알 수 없는 요청이에요.' });
    }
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function checkPw_(pw) {
  if (String(pw || '') !== ADMIN_PASSWORD) {
    Utilities.sleep(800);
    throw new Error('비밀번호가 맞지 않아요.');
  }
}

/* ============ 설정 ============ */
// forAdmin=true면 비공개 미션 이름도 보여줌 (참가자에게는 숨김)
function readConfig_(forAdmin) {
  const set = ensureSheets_().set;
  const last = Math.max(set.getLastRow(), 2);
  const vals = set.getRange(2, 1, last - 1, 5).getValues();
  const missions = [];
  const villages = [];
  vals.forEach((r) => {
    const no = Number(r[0]);
    if (no >= 1 && no <= MAX_MISSIONS && !missions.some((m) => m.no === no)) {
      const title = String(r[1] || '').trim();
      const locked = String(r[3] || '').trim() === '비공개' || !title;
      if (locked && !forAdmin) missions.push({ no: no, title: '', desc: '', locked: true });
      else missions.push({ no: no, title: title, desc: String(r[2] || '').trim(), locked: locked });
    }
    if (String(r[4]).trim()) villages.push(String(r[4]).trim());
  });
  missions.sort((a, b) => a.no - b.no);
  return { missions: missions, villages: villages };
}

/* ============ 제출 ============ */
function clean_(s, max) {
  let v = String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 200);
  if (/^[=+\-@]/.test(v)) v = "'" + v; // 시트 수식 주입 방지
  return v;
}

function submit_(p) {
  const name = clean_(p.name, 20);
  const village = clean_(p.village, 20);
  const phone4 = String(p.phone4 || '').trim();
  const missions = Array.from(new Set((p.missions || []).map(Number)))
    .filter((n) => n >= 1 && n <= MAX_MISSIONS).sort((a, b) => a - b);
  const photos = (p.photos || []).slice(0, MAX_PHOTOS);

  if (!name) throw new Error('이름을 입력해주세요.');
  if (!village) throw new Error('소속 마을을 입력해주세요.');
  if (!/^\d{4}$/.test(phone4)) throw new Error('전화번호 뒷자리 4자리를 숫자로 입력해주세요.');
  if (!missions.length) throw new Error('미션을 1개 이상 골라주세요.');
  const closed = readConfig_().missions.filter((m) => m.locked).map((m) => m.no);
  if (missions.some((n) => closed.indexOf(n) >= 0)) throw new Error('아직 공개되지 않은 미션이 들어 있어요. 새로고침 후 다시 골라주세요.');
  if (!photos.length) throw new Error('인증 사진을 1장 이상 올려주세요.');

  const tz = 'Asia/Seoul';
  const now = new Date();
  const id = 'SM' + Utilities.formatDate(now, tz, 'MMdd-HHmmss') + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();

  // 사진 저장
  const folder = getFolder_();
  const fileIds = [];
  const links = [];
  photos.forEach((ph, i) => {
    const m = String(ph.data || '').match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!m) throw new Error('사진 형식이 올바르지 않아요.');
    const bytes = Utilities.base64Decode(m[2]);
    if (bytes.length > 10 * 1024 * 1024) throw new Error('사진 한 장이 너무 커요. (10MB 이하)');
    const ext = m[1].split('/')[1].replace('jpeg', 'jpg');
    const blob = Utilities.newBlob(bytes, m[1], id + '_' + name + '_' + village + '_' + (i + 1) + '.' + ext);
    const file = folder.createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* 조직 정책으로 막히면 넘어감 */ }
    fileIds.push(file.getId());
    links.push(file.getUrl());
  });

  const row = new Array(HEAD.length).fill('');
  row[COL['제출ID']] = id;
  row[COL['제출시각']] = now;
  row[COL['이름']] = name;
  row[COL['마을']] = village;
  row[COL['전화뒷자리']] = phone4;
  row[COL['선택미션']] = missions.join(',');
  missions.forEach((n) => (row[COL[n + '주차']] = 'O'));
  row[COL['한마디']] = clean_(p.message, 200);
  row[COL['상태']] = '대기';
  row[COL['사진ID']] = fileIds.join('|');
  links.forEach((l, i) => (row[COL['사진링크' + (i + 1)]] = l));

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sub = ensureSheets_().sub;
    const r = sub.getLastRow() + 1;
    sub.getRange(r, COL['전화뒷자리'] + 1).setNumberFormat('@');
    sub.getRange(r, COL['선택미션'] + 1).setNumberFormat('@');
    sub.getRange(r, 1, 1, row.length).setValues([row]);
    sub.getRange(r, COL['제출시각'] + 1).setNumberFormat('yyyy-mm-dd hh:mm');
  } finally {
    lock.releaseLock();
  }
  return { ok: true, id: id };
}

/* ============ 읽기 ============ */
function readRows_() {
  const sub = ensureSheets_().sub;
  const n = sub.getLastRow() - 1;
  if (n < 1) return [];
  const vals = sub.getRange(2, 1, n, HEAD.length).getValues();
  return vals.filter((v) => v[COL['제출ID']]).map((v) => {
    const ids = String(v[COL['사진ID']] || '').split('|').filter(String);
    const iso = (d) => (d instanceof Date ? d.toISOString() : String(d || ''));
    return {
      id: String(v[COL['제출ID']]),
      time: iso(v[COL['제출시각']]),
      name: String(v[COL['이름']]).replace(/^'/, ''),
      village: String(v[COL['마을']]).replace(/^'/, ''),
      phone4: String(v[COL['전화뒷자리']]).padStart(4, '0'),
      missions: String(v[COL['선택미션']]).split(',').map(Number).filter(Boolean),
      message: String(v[COL['한마디']]).replace(/^'/, ''),
      status: String(v[COL['상태']] || '대기'),
      memo: String(v[COL['반려이유']] || ''),
      reviewedAt: iso(v[COL['처리시각']]),
      photos: ids.map((fid, i) => ({
        id: fid,
        url: String(v[COL['사진링크' + (i + 1)]] || 'https://drive.google.com/file/d/' + fid + '/view'),
        thumb: 'https://drive.google.com/thumbnail?id=' + fid + '&sz=w800'
      }))
    };
  });
}

function my_(p) {
  const name = String(p.name || '').trim();
  const phone4 = String(p.phone4 || '').trim();
  if (!name || !/^\d{4}$/.test(phone4)) throw new Error('이름과 뒷자리 4자리를 입력해주세요.');
  const records = readRows_()
    .filter((r) => r.name === name && r.phone4 === phone4)
    .map((r) => ({ time: r.time, missions: r.missions, status: r.status, memo: r.status === '반려' ? r.memo : '' }));
  return { ok: true, records: records };
}

function list_() {
  const cfg = readConfig_(true);
  return {
    ok: true,
    rows: readRows_(),
    missions: cfg.missions,
    villages: cfg.villages,
    sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
  };
}

/* ============ 승인 / 반려 ============ */
function review_(p) {
  const status = String(p.status || '');
  if (['승인', '반려', '대기'].indexOf(status) < 0) throw new Error('상태 값이 올바르지 않아요.');
  const ids = (p.ids || []).map(String);
  if (!ids.length) return { ok: true, changed: 0 };
  const want = new Set(ids);
  const now = new Date();

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sub = ensureSheets_().sub;
    const n = sub.getLastRow() - 1;
    if (n < 1) return { ok: true, changed: 0 };
    const idCol = sub.getRange(2, COL['제출ID'] + 1, n, 1).getValues();
    let changed = 0;
    idCol.forEach((r, i) => {
      if (!want.has(String(r[0]))) return;
      const row = i + 2;
      sub.getRange(row, COL['상태'] + 1).setValue(status);
      if (p.memo != null) sub.getRange(row, COL['반려이유'] + 1).setValue(clean_(p.memo, 100));
      const t = sub.getRange(row, COL['처리시각'] + 1);
      if (status === '대기') t.setValue(''); else t.setValue(now).setNumberFormat('yyyy-mm-dd hh:mm');
      changed++;
    });
    return { ok: true, changed: changed, reviewedAt: now.toISOString() };
  } finally {
    lock.releaseLock();
  }
}
