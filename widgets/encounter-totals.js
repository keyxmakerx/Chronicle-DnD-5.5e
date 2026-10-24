/**
 * D&D 5e encounter totals — the panel inside Chronicle's encounter builder.
 *
 * Chronicle's builder fires `chronicle:encounter-draft` on document after every
 * change, with the draft and an empty slot element. This script listens from
 * the moment it loads and fills the slot with the fight's totals: the heroes
 * and their levels, the creatures and their XP, and a bar that fills against
 * one number the DM owns, the XP their party handles.
 *
 * The DM's number is the only yardstick. The panel never calls a fight easy or
 * deadly itself: parties differ, and the DM knows theirs. A creature's XP comes
 * from its challenge rating through the SRD 5.1 table below; a figure a page
 * does not give (no page, no CR, no level) is said to be missing and left out
 * of the total, never guessed.
 *
 * Layout: pure maths first (exported for node tests), then the page glue.
 */
var EncounterTotals = (function () {
  'use strict';

  var SYSTEM_ID = 'dnd5e';
  var STATE_KEY = 'party';
  // Cached pages are re-read after this long so a hero levelling up, or
  // another DM changing the party's number, shows without a reload.
  var PAGE_TTL_MS = 60000;
  // The largest party number the panel stores; anything above is a typo.
  var MAX_HANDLES = 10000000;

  // Experience Points by Challenge Rating, from the SRD 5.1 (Open Game
  // License v1.0a). CR 0 is 10 XP for a creature with an attack and 0 for one
  // without; the table gives both, so the page's own "(0 XP)" wins when it
  // says so, and 10 is used otherwise.
  var XP_BY_CR = {
    '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
    '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900,
    '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
    '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000, '21': 33000, '22': 41000,
    '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000, '28': 120000,
    '29': 135000, '30': 155000
  };
  // Decimal spellings a page may use for the fractional ratings.
  var CR_DECIMAL = { '0.125': '1/8', '.125': '1/8', '0.25': '1/4', '.25': '1/4', '0.5': '1/2', '.5': '1/2' };

  function num(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = (typeof v === 'number') ? v : Number(String(v).trim());
    return isFinite(n) ? n : null;
  }

  function fieldsOf(entity) {
    return (entity && (entity.fields_data || entity.custom_fields)) || {};
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // grouped writes 1100 as "1,100" the same way in every browser and in node.
  function grouped(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // crXP reads a page's challenge rating ("1/4", "0.25", "5", "1/4 (50 XP)")
  // into {cr, xp}, or null when it is not a rating the table has. An XP figure
  // written on the page beside the rating wins, as in a printed stat block.
  function crXP(raw) {
    if (raw === null || raw === undefined) return null;
    var s = String(raw).trim().toLowerCase();
    if (!s) return null;
    var stated = null;
    var paren = s.match(/\(\s*([\d,]+)\s*xp\s*\)/);
    if (paren) {
      stated = num(paren[1].replace(/,/g, ''));
      s = s.replace(paren[0], '').trim();
    }
    s = s.replace(/^cr\s*/, '').replace(/\s+/g, '');
    if (CR_DECIMAL[s]) s = CR_DECIMAL[s];
    if (/^\d+$/.test(s)) s = String(parseInt(s, 10));
    if (!Object.prototype.hasOwnProperty.call(XP_BY_CR, s)) return null;
    return { cr: s, xp: stated !== null ? stated : XP_BY_CR[s] };
  }

  // readHero turns a hero page's state into a level, or says why there is none.
  function readHero(hero, entry) {
    var out = { id: hero.id, name: hero.name || '', level: null, reason: '' };
    if (!entry || entry.status === 'loading') { out.reason = 'Reading its page'; return out; }
    if (entry.status !== 'ok') { out.reason = 'Its page could not be read'; return out; }
    var lvl = num(fieldsOf(entry.entity).level);
    if (lvl === null || lvl < 1 || lvl > 20 || Math.floor(lvl) !== lvl) { out.reason = 'No level on its page'; return out; }
    out.level = lvl;
    return out;
  }

  // readCreature prices one creature row. state is 'priced', 'loading' or
  // 'missing'; only 'priced' rows enter the total.
  function readCreature(row, entry) {
    var out = {
      id: row.id, name: row.name || '', count: Math.max(1, Math.floor(num(row.count) || 1)),
      state: 'missing', reason: '', cr: null, unitXp: null, xp: null
    };
    if (!row.entityId) {
      out.reason = 'No page, so no challenge rating. Add its creature page to count it.';
      return out;
    }
    if (!entry || entry.status === 'loading') { out.state = 'loading'; out.reason = 'Reading its page'; return out; }
    if (entry.status !== 'ok') { out.reason = 'Its page could not be read, so it is left out.'; return out; }
    var r = crXP(fieldsOf(entry.entity).challenge_rating);
    if (!r) { out.reason = 'No challenge rating on its page, so it is left out.'; return out; }
    out.cr = r.cr; out.unitXp = r.xp; out.xp = r.xp * out.count; out.state = 'priced';
    return out;
  }

  // levelsText is "level 3" or "levels 3 to 4".
  function levelsText(levels) {
    if (!levels.length) return '';
    var lo = Math.min.apply(null, levels), hi = Math.max.apply(null, levels);
    return lo === hi ? 'level ' + lo : 'levels ' + lo + ' to ' + hi;
  }

  // compute turns the draft, whatever pages have been read, and the DM's
  // number into the panel's model. inp = { heroes: [{id, name, entry}],
  // creatures: [{row, entry}], handles: number|null }. Pure: no DOM, no fetching.
  function compute(inp) {
    var m = { heroes: [], levels: [], creatures: [], total: 0, count: 0, missing: [], loading: 0, handles: null, pct: null };
    (inp.heroes || []).forEach(function (h) {
      var r = readHero(h, h.entry);
      m.heroes.push(r);
      if (r.level !== null) m.levels.push(r.level);
      else if (r.reason === 'Reading its page') m.loading++;
      else m.missing.push(r.name + ': ' + r.reason.charAt(0).toLowerCase() + r.reason.slice(1) + '. Set it on the hero page.');
    });
    (inp.creatures || []).forEach(function (cr) {
      var c = readCreature(cr.row, cr.entry);
      m.creatures.push(c);
      m.count += c.count;
      if (c.state === 'priced') m.total += c.xp;
      else if (c.state === 'loading') m.loading++;
      else m.missing.push(c.name + ': ' + c.reason);
    });
    var hd = num(inp.handles);
    if (hd !== null && hd > 0) {
      m.handles = hd;
      m.pct = Math.round(m.total / hd * 100);
    }
    return m;
  }

  // summaryText is the line under "This fight":
  // "4 heroes, levels 3 to 4 · 6 creatures, 1,100 XP".
  function summaryText(m) {
    var parts = [];
    if (m.heroes.length) {
      var lv = levelsText(m.levels);
      parts.push(plural(m.heroes.length, 'hero', 'heroes') + (lv ? ', ' + lv : ''));
    }
    if (m.creatures.length) {
      var notCounted = m.creatures.filter(function (c) { return c.state !== 'priced'; }).length;
      parts.push(plural(m.count, 'creature', 'creatures') + ', ' + grouped(m.total) + ' XP' +
        (notCounted ? ' (' + plural(notCounted, 'row', 'rows') + ' not counted)' : ''));
    }
    return parts.join(' · ');
  }

  // meterText is the sentence under the bar. It reports the DM's own yardstick
  // and adds no difficulty word of its own.
  function meterText(m) {
    if (m.handles === null) return '';
    return grouped(m.total) + ' of ' + grouped(m.handles) + ' XP: ' + m.pct + '% of what you said they handle';
  }

  // parseHandles reads what the DM typed: '' clears the number, a whole
  // number from 1 to MAX_HANDLES sets it, and anything else is refused.
  function parseHandles(text) {
    var s = String(text === undefined || text === null ? '' : text).replace(/[\s,]/g, '').replace(/xp$/i, '');
    if (s === '') return { ok: true, value: null };
    if (!/^\d+$/.test(s)) return { ok: false };
    var n = parseInt(s, 10);
    if (n < 1 || n > MAX_HANDLES) return { ok: false };
    return { ok: true, value: n };
  }

  // handlesFrom reads the stored document's gm half; anything malformed reads
  // as "not set" rather than as a number.
  function handlesFrom(doc) {
    var v = doc && doc.gm && doc.gm.handles;
    return (typeof v === 'number' && isFinite(v) && v >= 1 && v <= MAX_HANDLES) ? Math.floor(v) : null;
  }

  // draftOf builds compute's input from the event detail and the page cache.
  function draftOf(detail, cache, handles) {
    var enc = (detail && detail.encounter) || {};
    return {
      heroes: (enc.heroes || []).map(function (h) { return { id: h.id, name: h.name, entry: cache[h.id] || null }; }),
      creatures: (enc.creatures || []).map(function (c) { return { row: c, entry: c.entityId ? (cache[c.entityId] || null) : null }; }),
      handles: handles
    };
  }

  var API = {
    XP_BY_CR: XP_BY_CR, PAGE_TTL_MS: PAGE_TTL_MS, MAX_HANDLES: MAX_HANDLES,
    crXP: crXP, readHero: readHero, readCreature: readCreature, levelsText: levelsText, compute: compute,
    summaryText: summaryText, meterText: meterText, parseHandles: parseHandles, handlesFrom: handlesFrom,
    draftOf: draftOf, grouped: grouped
  };

  // ── The page ───────────────────────────────────────────────────────────────

  var CSS = [
    '.dnd-et{display:flex;flex-direction:column;gap:8px;color:var(--color-text-body,#374151);font-size:13px;line-height:1.45}',
    '.dnd-et [hidden]{display:none!important}',
    '.dnd-et-lab{margin:0;font-size:13px;font-weight:700;color:var(--color-text-primary,#111827)}',
    '.dnd-et-sum{margin:0;font-variant-numeric:tabular-nums}',
    '.dnd-et-party{display:flex;flex-wrap:wrap;align-items:center;gap:6px}',
    '.dnd-et-sub{font-size:12px;color:var(--color-text-secondary,#6b7280)}',
    '.dnd-et-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;border:1px solid var(--color-border,#d1d5db);background:var(--color-card-bg,#fff);font-weight:600;font-variant-numeric:tabular-nums;color:var(--color-text-primary,#111827)}',
    '.dnd-et-chip:focus-within{border-color:var(--color-accent,#6366f1);box-shadow:0 0 0 2px color-mix(in srgb,var(--color-accent,#6366f1) 30%,transparent)}',
    // Chronicle styles text inputs globally; the chip is the box here.
    '.dnd-et .dnd-et-chip input[type=text]{width:6.5em;min-height:0;margin:0;border:0;border-radius:0;padding:2px 0;background:transparent;box-shadow:none;color:inherit;font:inherit;text-align:right;outline:none;-webkit-appearance:none;appearance:none}',
    '.dnd-et-chip input::placeholder{color:var(--color-text-secondary,#6b7280);font-weight:400}',
    '@media (pointer:coarse){.dnd-et-chip{min-height:44px}}',
    '.dnd-et-status{font-size:12px;color:var(--color-text-secondary,#6b7280)}',
    '.dnd-et-status.err{color:#b45309}',
    '.dnd-et-meter{height:10px;border-radius:5px;overflow:hidden;background:var(--color-bg-tertiary,#f3f4f6)}',
    '.dnd-et-meter span{display:block;height:100%;border-radius:5px;background:var(--color-accent,#6366f1);transition:width .25s ease}',
    '@media (prefers-reduced-motion:reduce){.dnd-et-meter span{transition:none}}',
    '.dnd-et-note{margin:0;font-size:12px;color:var(--color-text-secondary,#6b7280)}',
    '.dnd-et ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:3px}',
    '.dnd-et li{display:flex;gap:8px;font-size:12px}',
    '.dnd-et li i{font-style:normal;font-weight:700;width:1em;flex-shrink:0;color:#b45309}',
    '.dnd-et li span{min-width:0;overflow-wrap:anywhere}'
  ].join('');

  function injectStyles() {
    if (typeof document === 'undefined' || !document.head || document.querySelector('style[data-dnd-encounter-totals]')) return;
    var s = document.createElement('style');
    s.setAttribute('data-dnd-encounter-totals', 'true');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // h builds an element; text always goes in as textContent.
  function h(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined && text !== null && text !== '') el.textContent = text;
    return el;
  }

  // The panel's nodes are built once per slot and updated in place, because
  // the builder fires its draft event on every keystroke of the encounter's
  // name and a rebuilt input would lose what the DM is typing.
  function build(slot, cid) {
    injectStyles();
    slot.textContent = '';
    var els = {};
    els.root = h('div', 'dnd-et');
    els.root.setAttribute('role', 'group');
    els.root.setAttribute('aria-label', 'D&D encounter totals');
    els.root.appendChild(h('p', 'dnd-et-lab', 'This fight'));
    els.sum = h('p', 'dnd-et-sum');
    els.root.appendChild(els.sum);

    els.party = h('div', 'dnd-et-party');
    var inputId = 'dnd-et-handles-' + Math.random().toString(36).slice(2, 8);
    var lab = h('label', 'dnd-et-sub', 'Your party handles about');
    lab.setAttribute('for', inputId);
    var chip = h('span', 'dnd-et-chip');
    els.input = h('input');
    els.input.id = inputId;
    els.input.type = 'text';
    els.input.setAttribute('inputmode', 'numeric');
    els.input.setAttribute('autocomplete', 'off');
    els.input.setAttribute('placeholder', 'Type XP');
    els.input.setAttribute('aria-describedby', inputId + '-why');
    chip.appendChild(els.input);
    chip.appendChild(document.createTextNode('XP'));
    var why = h('span', 'dnd-et-sub', 'for the whole campaign');
    why.id = inputId + '-why';
    els.status = h('span', 'dnd-et-status');
    els.status.setAttribute('role', 'status');
    els.status.setAttribute('aria-live', 'polite');
    els.party.appendChild(lab);
    els.party.appendChild(chip);
    els.party.appendChild(why);
    els.party.appendChild(els.status);
    els.root.appendChild(els.party);

    els.meter = h('div', 'dnd-et-meter');
    els.meter.setAttribute('aria-hidden', 'true');
    els.fill = h('span');
    els.meter.appendChild(els.fill);
    els.root.appendChild(els.meter);
    els.note = h('p', 'dnd-et-note');
    els.root.appendChild(els.note);
    els.missing = h('ul');
    els.missing.setAttribute('aria-label', 'Not counted');
    els.root.appendChild(els.missing);

    els.input.addEventListener('input', function () { onTyping(cid, els.input.value); });
    els.input.addEventListener('change', function () { save(cid, els.input.value); });
    // Enter saves at once; kept from reaching any form around the builder.
    els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); save(cid, els.input.value); }
    });
    slot.appendChild(els.root);
    slot._dndEt = { els: els, cid: cid };
    return els;
  }

  // draw paints the model into the slot. Called from cache on every draft
  // event and again whenever a fetch or a save lands.
  function draw(slot, m, p) {
    var cid = p.cid;
    var held = slot._dndEt;
    var els = (held && held.cid === cid && held.els.root.parentNode === slot) ? held.els : build(slot, cid);

    els.sum.textContent = (m.heroes.length || m.creatures.length)
      ? summaryText(m) + (m.loading ? ' · reading ' + plural(m.loading, 'page', 'pages') + '…' : '')
      : 'Tick the heroes who are fighting and add creatures to see the totals.';

    var focused = (typeof document !== 'undefined' && document.activeElement === els.input);
    els.party.hidden = p.status === 'unsupported';
    els.input.disabled = p.status === 'loading' && p.value === null;
    if (!focused && p.preview === undefined) els.input.value = p.value === null ? '' : grouped(p.value);
    els.status.textContent = p.msg || '';
    els.status.className = 'dnd-et-status' + (p.err ? ' err' : '');

    els.meter.hidden = m.handles === null;
    if (m.handles !== null) els.fill.style.width = Math.min(Math.max(m.pct, 0), 100) + '%';
    if (p.status === 'unsupported') {
      els.note.textContent = 'This Chronicle cannot keep the party’s number yet. Once it is updated, type it here and every encounter’s bar fills against it.';
    } else if (m.handles !== null) {
      els.note.textContent = meterText(m);
    } else if (p.status === 'loading') {
      els.note.textContent = 'Reading the party’s number…';
    } else {
      els.note.textContent = 'Type the XP your party takes on comfortably, and change it as they grow. Every encounter’s bar fills against it.';
    }

    els.missing.textContent = '';
    m.missing.forEach(function (text) {
      var li = h('li');
      li.appendChild(h('i', '', '!'));
      li.appendChild(h('span', '', text));
      els.missing.appendChild(li);
    });
    els.missing.hidden = !m.missing.length;
  }

  // ── Fetching, saving and the draft listener ───────────────────────────────

  var pages = {};      // 'cid/id' -> {status, entity, at, inflight}
  var party = {};      // cid -> {status, value, at, inflight, msg, err, preview}
  var current = null;  // the latest event detail; its slot is the only one alive

  function getJSON(url) {
    return Chronicle.apiFetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' -> ' + r.status);
      return r.json();
    });
  }

  function stateUrl(cid) {
    return '/campaigns/' + encodeURIComponent(cid) + '/campaign-system-state/' + SYSTEM_ID + '/' + STATE_KEY;
  }

  function rerender() {
    if (!current || !current.slot || !current.slot.isConnected) return;
    show(current);
  }

  function partyOf(cid) {
    return party[cid] || (party[cid] = {
      status: 'loading', value: null, at: 0, inflight: false, msg: '', err: false, preview: undefined, saving: 0,
      chain: Promise.resolve()
    });
  }

  // ensureParty reads the DM's number, again after the TTL so another DM's
  // change shows. A Chronicle without the campaign-wide store answers 404 (or
  // 405), which the panel says plainly instead of offering a box that cannot
  // save.
  function ensureParty(cid) {
    var p = partyOf(cid);
    if (p.inflight || p.saving || (p.at && (Date.now() - p.at) < PAGE_TTL_MS)) return;
    p.inflight = true;
    Chronicle.apiFetch(stateUrl(cid)).then(function (r) {
      if (r.status === 404 || r.status === 405) { p.status = 'unsupported'; return null; }
      if (!r.ok) throw new Error('party -> ' + r.status);
      return r.json().then(function (doc) { p.status = 'ok'; p.value = handlesFrom(doc); });
    }).catch(function () {
      // A failed read keeps an earlier good answer rather than blanking it.
      if (p.status !== 'ok') { p.status = 'failed'; p.msg = 'Could not read the party’s number.'; p.err = true; }
    }).then(function () {
      p.inflight = false; p.at = Date.now();
      rerender();
    });
  }

  // onTyping fills the bar against what is being typed, before it is saved.
  function onTyping(cid, text) {
    var p = partyOf(cid), r = parseHandles(text);
    p.preview = r.ok ? r.value : undefined;
    p.msg = ''; p.err = false;
    rerender();
  }

  // save stores the DM's number. Saves run one after another, so a quick
  // second edit can never land before the first and be overwritten by it.
  function save(cid, text) {
    var p = partyOf(cid), r = parseHandles(text);
    if (!r.ok) {
      p.msg = 'Type a whole number of XP, like 1200.'; p.err = true;
      rerender();
      return;
    }
    if (r.value === p.value && !p.saving) { p.preview = undefined; p.msg = ''; p.err = false; rerender(); return; }
    p.preview = r.value; p.saving++; p.msg = 'Saving…'; p.err = false;
    rerender();
    var body = { gm: r.value === null ? {} : { handles: r.value } };
    p.chain = p.chain.then(function () {
      return Chronicle.apiFetch(stateUrl(cid), { method: 'PUT', body: body }).then(function (res) {
        if (!res.ok) throw new Error('save -> ' + res.status);
        return res.json();
      }).then(function (doc) {
        p.value = handlesFrom(doc); p.status = 'ok'; p.at = Date.now();
        if (p.saving === 1) { p.preview = undefined; p.msg = 'Saved'; p.err = false; }
      }, function () {
        p.msg = 'Could not save. Try again.'; p.err = true;
      }).then(function () {
        p.saving--;
        rerender();
      });
    });
  }

  function ensurePage(cid, id) {
    var key = cid + '/' + id, e = pages[key];
    if (e && (e.inflight || (Date.now() - e.at) < PAGE_TTL_MS)) return;
    if (!e) e = pages[key] = { status: 'loading', entity: null, at: Date.now(), inflight: false };
    e.inflight = true;
    getJSON('/api/v1/campaigns/' + encodeURIComponent(cid) + '/entities/' + encodeURIComponent(id)).then(function (entity) {
      e.status = 'ok'; e.entity = entity;
    }, function () {
      if (e.status !== 'ok') e.status = 'failed';
    }).then(function () {
      e.inflight = false; e.at = Date.now();
      rerender();
    });
  }

  function show(detail) {
    var cid = String(detail.campaignId || '');
    var p = partyOf(cid);
    var cache = {};
    var enc = detail.encounter || {};
    (enc.heroes || []).forEach(function (x) { cache[x.id] = pages[cid + '/' + x.id] || null; });
    (enc.creatures || []).forEach(function (x) { if (x.entityId) cache[x.entityId] = pages[cid + '/' + x.entityId] || null; });
    var handles = p.preview !== undefined ? p.preview : p.value;
    var m = compute(draftOf(detail, cache, p.status === 'unsupported' ? null : handles));
    draw(detail.slot, m, { cid: cid, status: p.status, value: p.value, preview: p.preview, msg: p.msg, err: p.err });
  }

  function onDraft(ev) {
    var d = ev && ev.detail;
    if (!d || !d.slot || !d.campaignId || typeof Chronicle === 'undefined') return;
    current = d;
    var cid = String(d.campaignId), enc = d.encounter || {};
    ensureParty(cid);
    (enc.heroes || []).forEach(function (x) { if (x.id) ensurePage(cid, x.id); });
    (enc.creatures || []).forEach(function (x) { if (x.entityId) ensurePage(cid, x.entityId); });
    show(d);
  }

  if (typeof document !== 'undefined' && document.addEventListener && typeof Chronicle !== 'undefined') {
    document.addEventListener('chronicle:encounter-draft', onDraft);
  }
  API.onDraft = onDraft;

  return API;
})();

// The manifest needs a registered widget; this one has nothing to mount. The
// panel arrives through the builder's draft event, listened for above.
if (typeof Chronicle !== 'undefined' && Chronicle && Chronicle.register) {
  Chronicle.register('encounter-totals', {
    init: function () {},
    destroy: function () {}
  });
}

// Test seam: expose the pure API for Node unit tests. Inert in a browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EncounterTotals;
}
