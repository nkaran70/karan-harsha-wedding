/* RSVP: opens the pop-ups, then sends the reply to the sheet in the background.
   Set RSVP_ENDPOINT to the Apps Script web app URL (see rsvp-setup.md). Until then replies are only kept on
   this device. A reply that cannot be sent is queued and retried the next time the page opens. */
(() => {
  const RSVP_ENDPOINT = '';
  const QUEUE = 'kh-rsvp-queue';
  const $ = s => document.querySelector(s);
  const store = {
    get: () => { try { return JSON.parse(localStorage.getItem(QUEUE) || '[]'); } catch { return []; } },
    set: v => { try { localStorage.setItem(QUEUE, JSON.stringify(v)); } catch {} }
  };

  document.addEventListener('click', e => {
    const open = e.target.closest('[data-open]');
    if (open) { const d = document.getElementById(open.dataset.open); if (d && d.showModal) d.showModal(); return; }
    if (e.target.classList && e.target.classList.contains('sheet')) e.target.close();   // tap on the backdrop
  });

  const send = async rec => {
    if (!RSVP_ENDPOINT) return false;
    try {
      await fetch(RSVP_ENDPOINT, {method: 'POST', mode: 'no-cors', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(rec)});
      return true;
    } catch { return false; }
  };
  const flush = async () => {
    const q = store.get(); if (!q.length || !RSVP_ENDPOINT) return;
    const left = [];
    for (const rec of q) if (!(await send(rec))) left.push(rec);
    store.set(left);
  };
  flush();

  const form = $('#rsvp-form'); if (!form) return;
  const err = form.querySelector('.rsvp-err'), done = $('.rsvp-done');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = form.name.value.trim(), party = (form.querySelector('[name=party]:checked') || {}).value;
    err.hidden = true;
    if (!name) { err.textContent = 'Please tell us your name.'; err.hidden = false; form.name.focus(); return; }
    if (!party) { err.textContent = 'Please choose Family or Couple.'; err.hidden = false; return; }
    if (form.company.value) return;                                  // a bot filled the hidden field
    const rec = {name, party, invitedAs: (new URLSearchParams(location.search).get('to') || '').slice(0, 60), at: new Date().toISOString()};
    store.set(store.get().concat(rec));                               // locked in on this device first
    form.hidden = true; done.querySelector('b').textContent = name; done.hidden = false;
    if (await send(rec)) store.set(store.get().filter(r => r.at !== rec.at));
  });
  $('#rsvp-dialog').addEventListener('close', () => {
    if (!done.hidden) { form.reset(); done.hidden = true; form.hidden = false; }
  });
})();
