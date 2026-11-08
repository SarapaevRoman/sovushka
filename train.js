/* Читалочка и Тренировка внимания. Использует помощников из index.html: $, el, frame, say, speak, owl, ding, shuffle, pick, shakeIt, updTotal, home. */
var TR = { stars: 0, lvl: 1, speed: [], schulte: {}, flash: 700, read: {}, sessions: 0 };
try { var _t = JSON.parse(localStorage.getItem('sova-train') || '{}'); for (var _k in _t) TR[_k] = _t[_k]; } catch (e) {}
function trSave() { try { localStorage.setItem('sova-train', JSON.stringify(TR)); } catch (e) {} if (typeof updTotal === 'function') updTotal(); }
function trainStars() { return TR.stars || 0; }
var TRTOK = 0;                                  /* таймеры текущего экрана */
function trTimer(fn, ms) { var my = TRTOK; return setTimeout(function () { if (my === TRTOK) fn(); }, ms); }
function trFrame(title, back) { TRTOK++; frame(title, back); }
function wordsOf(t) { return t.split(/\s+/).filter(function (w) { return /[а-яёa-z0-9]/i.test(w); }); }
function starsFor(err) { return err === 0 ? 3 : err <= 2 ? 2 : 1; }
function starLine(n, max) { max = max || 3; var s = ''; for (var i = 0; i < max; i++) s += i < n ? '★' : '<i>★</i>'; return s; }
function fmtTime(ms) { var s = Math.round(ms / 100) / 10; return s.toFixed(1).replace('.', ',') + ' с'; }

/* общее окно «Молодец» */
function trWin(stars, title, text, btn, next) {
  $('#powl').innerHTML = owl().replace('class="owl ', 'style="margin:0 auto" class="owl ');
  $('#ptitle').textContent = title || (stars === 3 ? 'Великолепно!' : stars === 2 ? 'Молодец!' : 'Получилось!');
  $('#pstars').innerHTML = [0, 1, 2].map(function (i) { return i < stars ? '<span>★</span>' : '<span><i>★</i></span>'; }).join('');
  $('#ptext').textContent = text || '';
  $('#pnext').textContent = btn || 'Дальше';
  $('#party').hidden = false; ding(true);
  speak($('#ptitle').textContent + ' ' + (text || ''));
  $('#pnext').onclick = function () { $('#party').hidden = true; next && next(); };
}
function trBubble(text, small) { return el('div', 'owlrow', owl(small === false ? '' : 'small') + '<div class="bubble">' + text + '</div>'); }
function tile(icon, title, sub, color, fn) {
  var b = el('button', 'bigbtn', '<div class="ic">' + icon + '</div><div><h2>' + title + '</h2><p>' + sub + '</p></div>');
  b.style.background = color; b.onclick = fn; return b;
}

/* ================= ЧИТАЛОЧКА ================= */
function readHome() {
  trFrame('Читалочка', home);
  var last = TR.speed.length ? TR.speed[TR.speed.length - 1].wpm : 0;
  S.append(trBubble(last ? 'В прошлый раз ты читала ' + last + ' слов в минуту. Давай ещё лучше!' : 'Здесь мы учимся читать быстро и понимать, о чём текст. Начни с проверки скорости!'));
  var big = el('div', 'big');
  big.append(
    tile('⏱️', 'Скорость чтения', 'Сколько слов в минуту ты читаешь', '#E2457F', function () { textPick('speed'); }),
    tile('🧠', 'Понимаю текст', 'Прочитай рассказ и ответь на вопросы', '#7A5CF0', function () { textPick('quiz'); }),
    tile('🔦', 'Читаю за огоньком', 'Огонёк бежит по словам — успевай за ним', '#E8833A', function () { textPick('fire'); }),
    tile('🔢', 'Таблицы Шульте', 'Найди числа по порядку как можно быстрее', '#1C8FD6', schulteHome),
    tile('⚡', 'Мелькающие слова', 'Успей прочитать слово, пока оно не исчезло', '#1FA39A', flashStart)
  );
  S.append(big);
  if (TR.speed.length) S.append(speedChart());
}

function speedChart() {
  var c = el('div', 'card'); c.style.marginTop = '16px';
  var list = TR.speed.slice(-8), max = Math.max.apply(null, list.map(function (x) { return x.wpm; }).concat([60]));
  c.innerHTML = '<h2 style="font-size:20px">📈 Моя скорость чтения</h2><p class="prog" style="margin:4px 0 10px">слов в минуту, последние попытки</p>';
  var g = el('div', 'chart');
  list.forEach(function (x) {
    var b = el('div', 'cbar', '<b>' + x.wpm + '</b><span style="height:' + Math.max(6, Math.round(x.wpm / max * 120)) + 'px"></span><small>' + x.d + '</small>');
    g.append(b);
  });
  c.append(g); return c;
}

function textPick(mode) {
  var names = { speed: 'Скорость чтения', quiz: 'Понимаю текст', fire: 'Читаю за огоньком' };
  trFrame(names[mode], readHome);
  var tip = { speed: 'Выбери рассказ. Когда нажмёшь «Старт», читай вслух, а в конце нажми «Прочитала!».',
    quiz: 'Выбери рассказ. Прочитай его сама или послушай Совушку, а потом ответь на вопросы.',
    fire: 'Выбери рассказ и скорость. Огонёк будет подсвечивать слова — читай вслед за ним.' }[mode];
  S.append(trBubble(tip));
  [1, 2, 3].forEach(function (lv) {
    var h = el('h3', 'lvlh', ['', '🌱 Лёгкие', '🌿 Средние', '🌳 Посложнее'][lv]); S.append(h);
    var l = el('div', 'flist');
    READ_TEXTS.filter(function (t) { return t.lvl === lv; }).forEach(function (t) {
      var st = TR.read[t.id] || 0;
      var b = el('button', 'fi', '<span class="fe">' + t.e + '</span><b>' + t.t + '<small class="wc">' + wordsOf(t.text).length + ' слов</small></b>' + (st ? '<span class="ck" style="color:var(--sun)">' + '★'.repeat(st) + '</span>' : ''));
      b.onclick = function () { mode === 'speed' ? speedRead(t) : mode === 'quiz' ? quizRead(t) : fireRead(t); };
      l.append(b);
    });
    S.append(l);
  });
}

function textBox(t, blurred) {
  var b = el('div', 'rtext' + (blurred ? ' blur' : ''), wordsOf(t.text).map(function (w) { return '<span>' + w + '</span>'; }).join(' '));
  return b;
}

/* --- скорость чтения --- */
function wpmNote(wpm) {
  if (wpm < 20) return 'Хорошее начало! Читай понемногу каждый день — и скорость обязательно вырастет.';
  if (wpm < 30) return 'Хорошо! Так читают в конце 1 класса.';
  if (wpm < 45) return 'Отлично! Так читают во 2 классе.';
  if (wpm < 60) return 'Здорово! Это хорошая скорость для конца 2 класса.';
  return 'Супер! Так читают в 3 классе!';
}
function speedRead(t) {
  trFrame('Скорость чтения', function () { textPick('speed'); });
  var c = el('div', 'fpage');
  c.innerHTML = '<div class="big-e">' + t.e + '</div><h2>' + t.t + '</h2>';
  var box = textBox(t, true), tm = el('div', 'timer', '0,0 с');
  var row = el('div', 'frow2'), go = el('button', 'go big', '▶ Старт');
  row.append(go); c.append(tm, box, row); S.append(c);
  var t0 = 0, iv = null, my = TRTOK;
  go.onclick = function () {
    if (!t0) {
      t0 = Date.now(); box.classList.remove('blur'); go.textContent = '✅ Прочитала!'; go.style.background = 'var(--berry)';
      iv = setInterval(function () { if (my !== TRTOK) { clearInterval(iv); return; } tm.textContent = fmtTime(Date.now() - t0); }, 100);
      return;
    }
    clearInterval(iv);
    var ms = Date.now() - t0, n = wordsOf(t.text).length, wpm = Math.round(n / (ms / 60000));
    if (ms < 4000) { tm.textContent = 'Слишком быстро — наверное, кнопка нажалась случайно. Попробуй ещё раз!'; t0 = 0; go.textContent = '▶ Старт'; go.style.background = ''; box.classList.add('blur'); return; }
    var d = new Date(); TR.speed.push({ id: t.id, wpm: wpm, d: d.getDate() + '.' + (d.getMonth() + 1) }); if (TR.speed.length > 40) TR.speed.shift(); trSave();
    S.innerHTML = '';
    var r = el('div', 'fpage center');
    r.innerHTML = '<div class="big-e">⏱️</div><h2>' + wpm + ' слов в минуту</h2><p class="prog">' + n + ' слов за ' + fmtTime(ms) + '</p><div class="short" style="margin-top:10px">' + wpmNote(wpm) + '</div>';
    var rr = el('div', 'frow2'); rr.style.justifyContent = 'center';
    var q = el('button', 'go big', '🧠 Ответить на вопросы'); q.onclick = function () { quizQ(t, function () { textPick('speed'); }, false); };
    var again = el('button', 'listen', '🔁 Ещё раз'); again.onclick = function () { speedRead(t); };
    rr.append(q, again); r.append(rr); S.append(r, speedChart());
    say(wpm + ' слов в минуту! ' + wpmNote(wpm) + ' А теперь проверим, что ты запомнила.');
  };
}

/* --- понимание текста --- */
function quizRead(t) {
  trFrame('Понимаю текст', function () { textPick('quiz'); });
  var c = el('div', 'fpage');
  c.innerHTML = '<div class="big-e">' + t.e + '</div><h2>' + t.t + '</h2>';
  var box = textBox(t, false);
  var row = el('div', 'frow2');
  var ls = el('button', 'fbtn', '🔊 Послушать'), go = el('button', 'go big', 'Я прочитала — к вопросам ›');
  var spans = box.children;
  ls.onclick = function () {
    if (ls.classList.contains('speaking')) { stopSay(); ls.classList.remove('speaking'); ls.textContent = '🔊 Послушать'; return; }
    ls.classList.add('speaking'); ls.textContent = '⏹ Стоп';
    var parts = splitSent(t.text), idx = [], k = 0;
    parts.forEach(function (p) { var n = wordsOf(p).length; idx.push([k, k + n]); k += n; });
    sayParts(parts, function (pi) {
      [].forEach.call(spans, function (s, j) { s.classList.toggle('now', pi >= 0 && j >= idx[pi][0] && j < idx[pi][1]); });
    }, function () { ls.classList.remove('speaking'); ls.textContent = '🔊 Послушать'; });
  };
  go.onclick = function () { stopSay(); quizQ(t, function () { textPick('quiz'); }, true); };
  row.append(ls, go); c.append(box, row); S.append(c);
}

/* Вопросы + порядок событий. showText — можно подглядывать в текст */
function quizQ(t, back, showText) {
  trFrame('Вопросы: ' + t.t, back);
  var err = 0, done = 0, total = t.q.length + 1;
  if (showText !== false) {
    var peek = el('button', 'listen', '📖 Подсмотреть текст'), tb = textBox(t, false); tb.hidden = true; tb.style.marginTop = '10px';
    peek.onclick = function () { tb.hidden = !tb.hidden; peek.textContent = tb.hidden ? '📖 Подсмотреть текст' : '🙈 Спрятать текст'; };
    var pw = el('div', 'card'); pw.style.marginBottom = '14px'; pw.append(peek, tb); S.append(pw);
  }
  var card = el('div', 'card');
  t.q.forEach(function (q, qi) {
    var b = el('div', 'q'); b.innerHTML = '<p>' + (qi + 1) + '. ' + q.q + '</p>';
    var os = el('div', 'opts'), ok = false;
    shuffle(q.o.map(function (o, i) { return i; })).forEach(function (i) {
      var o = el('button', 'opt', q.o[i]);
      o.onclick = function () {
        if (ok) return;
        if (i === q.a) { ok = true; o.classList.add('right'); ding(true); finish(); }
        else { err++; o.classList.add('wrong'); shakeIt(o); ding(false); }
      };
      os.append(o);
    });
    var sb = sayBtn(function () { return q.q + ' ' + q.o.join(', или '); }); b.querySelector('p').append(sb);
    b.append(os); card.append(b);
  });
  /* порядок событий */
  var ob = el('div', 'q'); ob.innerHTML = '<p>' + total + '. Нажимай на события по порядку: что было сначала, что потом?</p>';
  var ol = el('div', 'opts'), next = 0;
  shuffle(t.ord.map(function (x, i) { return i; })).forEach(function (i) {
    var o = el('button', 'opt', t.ord[i]);
    o.onclick = function () {
      if (o.classList.contains('right')) return;
      if (i === next) { next++; o.classList.add('right'); o.innerHTML = '<b>' + next + '.</b> ' + t.ord[i]; ding(true); if (next === t.ord.length) finish(); }
      else { err++; o.classList.add('wrong'); shakeIt(o); ding(false); setTimeout(function () { o.classList.remove('wrong'); }, 600); }
    };
    ol.append(o);
  });
  ob.append(ol); card.append(ob); S.append(card);
  function finish() {
    done++; if (done < total) return;
    var st = starsFor(err), prev = TR.read[t.id] || 0;
    if (st > prev) { TR.stars += st - prev; TR.read[t.id] = st; }
    trSave();
    trWin(st, null, err ? 'Ты ответила на все вопросы! Ошибок: ' + err + '.' : 'Все ответы верные с первой попытки!', 'К рассказам', back);
  }
}

/* --- чтение за огоньком --- */
function fireRead(t) {
  trFrame('Читаю за огоньком', function () { textPick('fire'); });
  var wpm0 = TR.fire || (TR.speed.length ? Math.max(20, Math.min(100, TR.speed[TR.speed.length - 1].wpm + 5)) : 35);
  var c = el('div', 'fpage');
  c.innerHTML = '<div class="big-e">' + t.e + '</div><h2>' + t.t + '</h2>';
  var sp = el('div'); sp.innerHTML = '<b>Скорость огонька: <span class="fv"></span> слов в минуту</b><input class="range" type="range" min="15" max="120" step="5">';
  var r = $('input', sp), fv = $('.fv', sp); r.value = wpm0; fv.textContent = wpm0;
  r.oninput = function () { fv.textContent = r.value; TR.fire = +r.value; trSave(); };
  var box = textBox(t, false), words = box.children;
  var row = el('div', 'frow2'), go = el('button', 'go big', '▶ Поехали!');
  row.append(go); c.append(sp, box, row); S.append(c);
  var i = -1, run = false;
  function step() {
    if (!run) return;
    if (i >= 0 && words[i]) words[i].classList.remove('fire');
    i++;
    if (i >= words.length) { run = false; go.textContent = '🧠 К вопросам'; go.onclick = function () { quizQ(t, function () { textPick('fire'); }, true); }; return; }
    words[i].classList.add('fire'); if (i > 0) words[i - 1].classList.add('past');
    words[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    var w = words[i].textContent, base = 60000 / (+r.value);
    trTimer(step, base * (/[.!?…»]$/.test(w) ? 1.6 : /[,:;—]$/.test(w) ? 1.25 : 1) * (w.length > 8 ? 1.2 : 1));
  }
  go.onclick = function () {
    if (run) { run = false; go.textContent = '▶ Дальше'; return; }
    run = true; go.textContent = '⏸ Пауза'; step();
  };
}

/* --- таблицы Шульте --- */
function schulteHome() {
  trFrame('Таблицы Шульте', readHome);
  S.append(trBubble('Смотри в центр таблицы и находи числа по порядку: 1, 2, 3… Старайся не водить глазами, а видеть всю таблицу сразу!'));
  var big = el('div', 'big');
  [[3, '🟢 Маленькая', 'числа от 1 до 9'], [4, '🟡 Средняя', 'числа от 1 до 16'], [5, '🔴 Настоящая', 'числа от 1 до 25']].forEach(function (x) {
    var best = TR.schulte[x[0]];
    big.append(tile(x[0] + '×' + x[0], x[1], x[2] + (best ? ' · рекорд ' + fmtTime(best) : ''), ['', '', '', '#1FA39A', '#E8833A', '#E2457F'][x[0]], function () { schulte(x[0]); }));
  });
  S.append(big);
}
function schulte(n) {
  trFrame('Таблица ' + n + '×' + n, schulteHome);
  var N = n * n, nums = shuffle(Array.from({ length: N }, function (_, i) { return i + 1; }));
  var head = el('div', 'shead', '<span>Найди: <b class="need">1</b></span><span class="timer">0,0 с</span>');
  var g = el('div', 'schulte'); g.style.gridTemplateColumns = 'repeat(' + n + ',1fr)';
  var cur = 1, t0 = 0, err = 0, my = TRTOK, iv;
  nums.forEach(function (v) {
    var b = el('button', 'sc', String(v));
    b.onclick = function () {
      if (!t0) { t0 = Date.now(); iv = setInterval(function () { if (my !== TRTOK) { clearInterval(iv); return; } $('.timer', head).textContent = fmtTime(Date.now() - t0); }, 100); }
      if (v === cur) {
        b.classList.add('ok'); cur++; $('.need', head).textContent = cur <= N ? cur : '✔';
        if (cur > N) {
          clearInterval(iv); var ms = Date.now() - t0, best = TR.schulte[n], rec = !best || ms < best;
          if (rec) TR.schulte[n] = ms;
          var st = starsFor(err); TR.stars += st; trSave();
          trWin(st, rec ? 'Новый рекорд!' : null, 'Время: ' + fmtTime(ms) + (err ? ', ошибок: ' + err : ', без ошибок!') + (best && !rec ? ' Рекорд: ' + fmtTime(best) + '.' : ''), 'Ещё раз', function () { schulte(n); });
        }
      } else { err++; shakeIt(b); ding(false); }
    };
    g.append(b);
  });
  var dot = el('div', 'sdot');
  var wrap = el('div', 'swrap'); wrap.append(g, dot);
  S.append(head, wrap);
  say('Найди число один.');
}

/* --- мелькающие слова --- */
function flashStart() {
  trFrame('Мелькающие слова', readHome);
  S.append(trBubble('Слово появится всего на мгновение. Успей его прочитать и найди среди похожих! Чем лучше получается, тем быстрее мелькают слова.'));
  var c = el('div', 'card center');
  c.innerHTML = '<p class="prog">Сейчас слово показывается ' + TR.flash + ' миллисекунд</p>';
  var go = el('button', 'go big', '⚡ Начать (10 слов)'); go.onclick = function () { flashRound(0, 0); };
  c.append(go); S.append(c);
}
function similarWords(w) {
  var same = WORDS.filter(function (x) { return x !== w && Math.abs(x.length - w.length) <= 1; });
  var close = same.filter(function (x) { return x[0] === w[0] || x.slice(-2) === w.slice(-2); });
  var out = shuffle(close).slice(0, 2);
  var sw = w.length > 3 ? w.slice(0, 1) + w.slice(2, 3) + w.slice(1, 2) + w.slice(3) : null;  /* переставленные буквы */
  if (sw && sw !== w && out.indexOf(sw) < 0) out.push(sw);
  shuffle(same).forEach(function (x) { if (out.length < 3 && out.indexOf(x) < 0) out.push(x); });
  return out.slice(0, 3);
}
function flashRound(k, err) {
  trFrame('Слово ' + (k + 1) + ' из 10', flashStart);
  var maxLen = TR.flash < 350 ? 9 : TR.flash < 550 ? 7 : 5;
  var pool = WORDS.filter(function (w) { return w.length <= maxLen && w.length >= Math.min(maxLen - 2, 4); });
  var w = pick(pool);
  var c = el('div', 'card center');
  var scr = el('div', 'flash', '<span class="fx">+</span>');
  var info = el('p', 'prog', 'Смотри на крестик…');
  c.append(info, scr); S.append(c);
  trTimer(function () {
    scr.innerHTML = '<span class="fw">' + w + '</span>';
    trTimer(function () {
      scr.innerHTML = '<span class="fx">▒▒▒▒▒</span>'; info.textContent = 'Какое слово ты увидела?';
      var os = el('div', 'opts'); os.style.marginTop = '12px';
      shuffle([w].concat(similarWords(w))).forEach(function (x) {
        var o = el('button', 'opt', x); o.style.textAlign = 'center'; o.style.fontSize = '22px';
        o.onclick = function () {
          var good = x === w;
          o.classList.add(good ? 'right' : 'wrong'); ding(good);
          if (!good) { [].forEach.call(os.children, function (b) { if (b.textContent === w) b.classList.add('right'); }); }
          TR.flash = Math.round(Math.max(120, Math.min(1500, TR.flash * (good ? 0.88 : 1.2)))); trSave();
          [].forEach.call(os.children, function (b) { b.onclick = null; });
          trTimer(function () {
            var e2 = err + (good ? 0 : 1);
            if (k < 9) flashRound(k + 1, e2);
            else { var st = e2 <= 1 ? 3 : e2 <= 3 ? 2 : 1; TR.stars += st; trSave(); trWin(st, null, 'Правильно ' + (10 - e2) + ' из 10! Теперь слово показывается ' + TR.flash + ' миллисекунд.', 'Ещё раз', flashStart); }
          }, good ? 700 : 1400);
        };
        os.append(o);
      });
      c.append(os);
    }, TR.flash);
  }, 900);
}

/* ================= ТРЕНИРОВКА ВНИМАНИЯ (генератор) ================= */
var GEN_TYPES = ['hunt', 'same', 'changed', 'odd', 'errors', 'scramble', 'series', 'memo'];
var GEN_NAMES = { hunt: 'Охота на букву', same: 'Одинаковые или нет?', changed: 'Что изменилось?', odd: 'Найди лишнее', errors: 'Найди ошибки', scramble: 'Собери слово', series: 'Продолжи ряд', memo: 'Запомни картинки' };
function genHome() {
  trFrame('Тренировка внимания', home);
  S.append(trBubble('Здесь задания каждый раз новые — они никогда не закончатся! Чем лучше получается, тем сложнее уровень.'));
  var c = el('div', 'card center');
  c.innerHTML = '<div class="lvlbadge">Уровень ' + TR.lvl + ' из 5</div><p class="prog">Пройдено тренировок: ' + (TR.sessions || 0) + '</p>';
  var go = el('button', 'go big', '▶ Начать тренировку (5 заданий)'); go.onclick = function () { genSession(); };
  c.append(go);
  var types = el('div', 'chips'); types.style.justifyContent = 'center'; types.style.marginTop = '12px';
  GEN_TYPES.forEach(function (tp) { var b = el('button', 'chip', GEN_NAMES[tp]); b.onclick = function () { genTask(tp, { list: [tp], i: 0, st: [], single: true }); }; types.append(b); });
  c.append(el('p', 'prog', 'Или выбери любимое задание:'), types);
  S.append(c);
}
function genSession() {
  var list = shuffle(GEN_TYPES).slice(0, 5);
  genTask(list[0], { list: list, i: 0, st: [] });
}
function genDone(ses, err) {
  var st = starsFor(err); ses.st.push(st); TR.stars += st; trSave();
  if (ses.single) { trWin(st, null, err ? 'Ошибок: ' + err + '.' : 'Без единой ошибки!', 'Ещё такое же', function () { genTask(ses.list[0], ses); }); return; }
  ses.i++;
  if (ses.i < ses.list.length) { trWin(st, null, 'Задание ' + ses.i + ' из ' + ses.list.length + ' выполнено!', 'Дальше', function () { genTask(ses.list[ses.i], ses); }); return; }
  var sum = ses.st.reduce(function (a, b) { return a + b; }, 0), avg = sum / ses.st.length, msg;
  TR.sessions = (TR.sessions || 0) + 1;
  if (avg >= 2.6 && TR.lvl < 5) { TR.lvl++; msg = 'Ты так хорошо справилась, что открыт уровень ' + TR.lvl + '!'; }
  else if (avg < 1.6 && TR.lvl > 1) { TR.lvl--; msg = 'Немного потренируемся на уровне ' + TR.lvl + '.'; }
  else msg = 'Ты набрала ' + sum + ' звёзд из 15!';
  trSave();
  trWin(Math.round(avg), 'Тренировка окончена!', msg, 'Ещё тренировку', genHome);
}
function genCard(tp, ses, doText) {
  trFrame(GEN_NAMES[tp] + (ses.single ? '' : ' · ' + (ses.i + 1) + '/' + ses.list.length), genHome);
  var c = el('div', 'card');
  var d = el('p', 'do', doText); d.append(sayBtn(function () { return d.textContent; }));
  c.append(el('span', 'tag wit', 'Уровень ' + TR.lvl), d); S.append(c);
  speak(doText);
  return c;
}
function genTask(tp, ses) { GEN[tp](ses); }

var CONF = [['Б', 'Д'], ['Ш', 'Щ'], ['П', 'Т'], ['И', 'Н'], ['Р', 'Ь'], ['О', 'С'], ['Е', 'З'], ['М', 'Л'], ['Ж', 'Х'], ['Ц', 'Щ']];
var FILL = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЫЭЮЯ';
var GEN = {
  hunt: function (ses) {
    var pr = pick(CONF), tg = pr[0], n = 16 + TR.lvl * 6, s = [];
    for (var i = 0; i < n; i++) { var r = Math.random(); s.push(r < 0.22 ? tg : r < 0.45 ? pr[1] : FILL[Math.floor(Math.random() * FILL.length)]); }
    if (s.indexOf(tg) < 0) s[3] = tg;
    var need = s.filter(function (x) { return x === tg; }).length, got = 0, err = 0;
    var c = genCard('hunt', ses, 'Найди и нажми все буквы «' + tg + '». Не перепутай с буквой «' + pr[1] + '»!');
    var box = el('div', 'letters'), cnt = el('div', 'counter', 'Осталось найти: ' + need);
    s.forEach(function (ch) {
      var b = el('button', 'lt', ch);
      b.onclick = function () {
        if (b.classList.contains('g0')) return;
        if (ch === tg) { b.classList.add('g0'); got++; cnt.textContent = need - got ? 'Осталось найти: ' + (need - got) : 'Все нашла!'; ding(true); if (got === need) trTimer(function () { genDone(ses, err); }, 500); }
        else { err++; shakeIt(b); ding(false); }
      };
      box.append(b);
    });
    c.append(box, cnt);
  },
  same: function (ses) {
    var k = 3 + TR.lvl, len = 3 + TR.lvl, err = 0, left = 0;
    var c = genCard('same', ses, 'Сравни пары. Если они совсем одинаковые — жми «=», если хоть чем-то отличаются — жми «≠».');
    var alph = TR.lvl < 3 ? 'АОУЫЭИЕМНЛКТСР' : 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩ0123456789';
    for (var j = 0; j < k; j++) (function () {
      var a = ''; for (var i = 0; i < len; i++) a += alph[Math.floor(Math.random() * alph.length)];
      var diff = Math.random() < 0.5, b = a;
      if (diff) { var p = Math.floor(Math.random() * len), ch; do { ch = alph[Math.floor(Math.random() * alph.length)]; } while (ch === a[p]); b = a.slice(0, p) + ch + a.slice(p + 1); }
      left++;
      var row = el('div', 'pair'); row.innerHTML = '<span class="pw mono">' + a + '&nbsp;&nbsp;&nbsp;' + b + '</span>';
      [['=', false], ['≠', true]].forEach(function (o) {
        var btn = el('button', 'opt', o[0]); btn.style.minWidth = '56px'; btn.style.textAlign = 'center'; btn.style.fontSize = '22px';
        btn.onclick = function () {
          if (row.dataset.ok) return;
          if (o[1] === diff) { row.dataset.ok = 1; btn.classList.add('right'); ding(true); left--; if (!left) trTimer(function () { genDone(ses, err); }, 500); }
          else { err++; btn.classList.add('wrong'); shakeIt(btn); ding(false); }
        };
        row.append(btn);
      });
      c.append(row);
    })();
  },
  changed: function (ses) {
    var n = 3 + TR.lvl, items = shuffle(MEMO_ICONS).slice(0, n), spare = MEMO_ICONS.filter(function (x) { return items.indexOf(x) < 0; });
    var pos = Math.floor(Math.random() * n), err = 0;
    var c = genCard('changed', ses, 'Запомни картинки! Скоро одна из них поменяется — найди, какая.');
    var row = el('div', 'memo big2'); row.innerHTML = items.map(function (x) { return '<span>' + x + '</span>'; }).join('');
    var info = el('div', 'counter', ''); c.append(row, info);
    var sec = Math.max(3, 7 - TR.lvl) + Math.round(n * 0.4), left = sec;
    info.textContent = 'Запоминай: ' + left;
    var tick = function () {
      left--; if (left > 0) { info.textContent = 'Запоминай: ' + left; trTimer(tick, 1000); return; }
      row.classList.add('hide'); info.textContent = '…';
      trTimer(function () {
        var now = items.slice(); now[pos] = pick(spare);
        row.classList.remove('hide'); row.innerHTML = '';
        info.textContent = 'Что изменилось? Нажми на новую картинку.';
        now.forEach(function (x, i) {
          var b = el('button', 'mbtn', x);
          b.onclick = function () { if (i === pos) { b.classList.add('ok'); ding(true); trTimer(function () { genDone(ses, err); }, 500); } else { err++; shakeIt(b); ding(false); } };
          row.append(b);
        });
      }, 900);
    };
    trTimer(tick, 1000);
  },
  odd: function (ses) {
    var side = Math.min(7, 3 + TR.lvl), pr = shuffle(pick(ODD_PAIRS)), N = side * side, odd = Math.floor(Math.random() * N), err = 0, t0 = Date.now();
    var c = genCard('odd', ses, 'Все картинки одинаковые, кроме одной. Найди её!');
    var g = el('div', 'oddg'); g.style.gridTemplateColumns = 'repeat(' + side + ',1fr)';
    for (var i = 0; i < N; i++) (function (i) {
      var b = el('button', 'ob', i === odd ? pr[1] : pr[0]);
      b.onclick = function () { if (i === odd) { b.classList.add('ok'); ding(true); var s = Math.round((Date.now() - t0) / 100) / 10; $('.do', c).textContent = 'Нашла за ' + String(s).replace('.', ',') + ' секунды!'; trTimer(function () { genDone(ses, err); }, 700); } else { err++; shakeIt(b); ding(false); } };
      g.append(b);
    })(i);
    c.append(g);
  },
  errors: function (ses) {
    var nErr = TR.lvl >= 3 ? 2 : 1, sents = shuffle(SENTS).slice(0, TR.lvl >= 4 ? 2 : 1);
    var text = sents.join('. ') + '.', words = text.split(' ');
    var cand = words.map(function (w, i) { return i; }).filter(function (i) { return words[i].replace(/[.,]/g, '').length >= 4; });
    var bad = shuffle(cand).slice(0, nErr), orig = {}, err = 0, found = 0;
    var SIM = { о: 'а', а: 'о', е: 'и', и: 'е', б: 'д', д: 'б', ш: 'щ', с: 'з', з: 'с', т: 'п', п: 'т' };
    bad.forEach(function (i) {
      var w = words[i], m = w.match(/^(.*?)([.,]?)$/), core = m[1], tail = m[2], nw = core;
      var idx = [], j; for (j = 1; j < core.length - 1; j++) if (SIM[core[j]]) idx.push(j);
      if (idx.length && Math.random() < 0.6) { j = pick(idx); nw = core.slice(0, j) + SIM[core[j]] + core.slice(j + 1); }
      else { j = 1 + Math.floor(Math.random() * (core.length - 2)); nw = core.slice(0, j) + core[j + 1] + core[j] + core.slice(j + 2); }
      if (nw === core) nw = core.slice(0, 1) + core.slice(2, 3) + core.slice(1, 2) + core.slice(3);
      orig[i] = w; words[i] = nw + tail;
    });
    var c = genCard('errors', ses, 'В тексте ' + (nErr === 1 ? 'спряталась одна ошибка' : 'спрятались две ошибки') + '. Найди и нажми на слова с ошибками!');
    var box = el('div', 'etext');
    words.forEach(function (w, i) {
      var b = el('button', 'tok', w);
      b.onclick = function () {
        if (b.classList.contains('fixed')) return;
        if (orig[i]) { b.classList.add('fixed'); b.innerHTML = '<s>' + w + '</s>' + orig[i]; ding(true); found++; if (found === bad.length) trTimer(function () { genDone(ses, err); }, 900); }
        else { err++; shakeIt(b); ding(false); }
      };
      box.append(b);
    });
    c.append(box);
  },
  scramble: function (ses) {
    var maxL = 3 + TR.lvl, pool = WORDS.filter(function (w) { return w.length >= Math.max(3, maxL - 2) && w.length <= maxL + 1; });
    var w = pick(pool), letters, tries = 0, err = 0;
    do { letters = shuffle(w.split('')); tries++; } while (letters.join('') === w && tries < 10);
    var c = genCard('scramble', ses, 'Буквы перепутались! Нажимай на них по порядку и собери слово.');
    var out = el('div', 'slots'), box = el('div', 'letters'), pos = 0;
    w.split('').forEach(function () { out.append(el('div', 'slot', '')); });
    letters.forEach(function (ch) {
      var b = el('button', 'lt', ch.toUpperCase());
      b.onclick = function () {
        if (b.disabled) return;
        if (ch === w[pos]) { out.children[pos].textContent = ch.toUpperCase(); out.children[pos].classList.add('full'); pos++; b.disabled = true; b.style.opacity = .25; ding(true);
          if (pos === w.length) trTimer(function () { genDone(ses, err); }, 600); }
        else { err++; shakeIt(b); ding(false); if (err === 3) { $('.do', c).textContent = 'Подсказка: слово начинается на «' + w[0].toUpperCase() + '» и в нём ' + w.length + ' букв.'; } }
      };
      box.append(b);
    });
    out.style.display = 'flex'; out.style.justifyContent = 'center'; out.style.gap = '6px'; out.style.flexWrap = 'wrap'; out.style.margin = '10px 0';
    c.append(out, box);
  },
  series: function (ses) {
    var rounds = 3, r = 0, err = 0;
    var c = genCard('series', ses, 'Найди правило и выбери, какое число пропущено.');
    var area = el('div'); c.append(area);
    function one() {
      var L = TR.lvl, kind = pick(L < 2 ? ['add'] : L < 3 ? ['add', 'sub'] : L < 4 ? ['add', 'sub', 'alt'] : ['add', 'sub', 'alt', 'dbl']);
      var a = 1 + Math.floor(Math.random() * (L < 3 ? 10 : 20)), d = 1 + Math.floor(Math.random() * (L < 2 ? 3 : L < 4 ? 5 : 9)), seq = [];
      for (var i = 0; i < 5; i++) {
        if (kind === 'add') seq.push(a + d * i);
        else if (kind === 'sub') seq.push(a + d * 5 - d * i);
        else if (kind === 'alt') seq.push(a + Math.floor(i / 2) * d + (i % 2 ? 10 : 0));
        else seq.push((a % 5 + 1) * Math.pow(2, i));
      }
      var gap = 1 + Math.floor(Math.random() * 4), ans = seq[gap];
      var opts = [ans, ans + d, Math.max(0, ans - d)].filter(function (v, i, s) { return s.indexOf(v) === i; });
      while (opts.length < 3) opts.push(ans + opts.length + 1);
      area.innerHTML = '';
      var row = el('div', 'chain'); seq.forEach(function (v, i) { row.append(el('span', 'word', i === gap ? '?' : String(v))); }); area.append(row);
      var os = el('div', 'row');
      shuffle(opts).forEach(function (v) {
        var b = el('button', 'opt', String(v)); b.style.minWidth = '70px'; b.style.textAlign = 'center'; b.style.fontSize = '22px';
        b.onclick = function () {
          if (v === ans) { b.classList.add('right'); ding(true); row.children[gap].textContent = ans; r++; trTimer(function () { r < rounds ? one() : genDone(ses, err); }, 700); }
          else { err++; b.classList.add('wrong'); shakeIt(b); ding(false); }
        };
        os.append(b);
      });
      area.append(os, el('p', 'prog', 'Ряд ' + (r + 1) + ' из ' + rounds));
    }
    one();
  },
  memo: function (ses) {
    var n = 2 + TR.lvl, show = shuffle(MEMO_ICONS).slice(0, n), extra = shuffle(MEMO_ICONS.filter(function (x) { return show.indexOf(x) < 0; })).slice(0, Math.max(4, n + 2));
    var err = 0, got = 0;
    var c = genCard('memo', ses, 'Запомни все картинки. Потом найди их среди других!');
    var row = el('div', 'memo big2'); row.innerHTML = show.map(function (x) { return '<span>' + x + '</span>'; }).join('');
    var info = el('div', 'counter'); c.append(row, info);
    var left = 2 + n; info.textContent = 'Запоминай: ' + left;
    var tick = function () {
      left--; if (left > 0) { info.textContent = 'Запоминай: ' + left; trTimer(tick, 1000); return; }
      row.innerHTML = ''; info.textContent = 'Нажми на все картинки, которые ты видела (их ' + n + ').';
      shuffle(show.concat(extra)).forEach(function (x) {
        var b = el('button', 'mbtn', x);
        b.onclick = function () {
          if (b.classList.contains('ok')) return;
          if (show.indexOf(x) >= 0) { b.classList.add('ok'); got++; ding(true); if (got === n) trTimer(function () { genDone(ses, err); }, 600); }
          else { err++; shakeIt(b); ding(false); b.disabled = true; b.style.opacity = .35; }
        };
        row.append(b);
      });
    };
    trTimer(tick, 1000);
  }
};
