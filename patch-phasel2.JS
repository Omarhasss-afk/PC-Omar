/* يُضاف بعد patch-phase1.js:  <script src="patch-phase2.js"></script> */
(() => {
  const A = (p, o = {}) => fetch('/api/' + p, { credentials: 'same-origin', headers: { 'content-type': 'application/json' }, ...o, body: o.body && JSON.stringify(o.body) })
    .then(r => r.json().then(j => Array.isArray(j) ? { ok: r.ok, list: j } : { ok: r.ok, ...j })).catch(() => ({ ok: false }));
  const E = escapeHtml, $ = id => document.getElementById(id), LS = localStorage;
  const ST = [['Registered', 'تم تسجيل البيانات'], ['Booking Day', 'يوم الحجز والميعاد'], ['On The Way', 'الفني في الطريق إليك'], ['Arrived', 'وصل الفني للموقع المحدد'], ['In Progress', 'جاري الفحص والإصلاح'], ['Completed', 'تم انتهاء الهدف']];
  const STEPS = ['الجهاز', 'الخدمات', 'المشكلة', 'الموعد', 'بياناتك', 'التأكيد'];
  const S = { step: 0, dir: 1, device: detectedInfo.deviceType, svc: new Set(), all: [], date: '', slot: '', booked: [], poll: null };
  const sec = document.querySelector('#booking-section > div');
  document.head.insertAdjacentHTML('beforeend', '<style>@keyframes wz{from{opacity:0;transform:translateX(calc(var(--d)*28px))}to{opacity:1;transform:none}}.wz-p{animation:wz .35s ease both}.wz-o{border:2px solid #e5e7eb;border-radius:1rem;padding:.9rem;cursor:pointer;transition:.2s}.wz-o.on{border-color:#E11D48;background:#fff1f2}@media(prefers-reduced-motion:reduce){.wz-p{animation:none}}</style>');

  /* الفيدباك يتنقل من الواجهة الرئيسية لصفحة الأوردر المنتهي */
  const fbForm = document.querySelector('form[onsubmit^="handleAddReview"]'); if (fbForm) fbForm.parentElement.classList.add('hidden');
  A('reviews').then(r => { if (r.list && r.list.length) $('reviews-grid').innerHTML = r.list.map(v => `<div class="bg-gray-900 p-5 rounded-2xl border border-gray-800"><div class="text-amber-400 text-xs mb-2">${'★'.repeat(v.rating)}${'☆'.repeat(5 - v.rating)}</div><p class="text-sm text-gray-300 mb-3">"${E(v.comment)}"</p><div class="text-xs font-bold text-crimson">— ${E(v.name)}</div></div>`).join(''); });

  const go = n => { S.dir = n > S.step ? -1 : 1; S.step = n; wizard(); };
  const phoneOk = v => /^01[0125]\d{8}$/.test(v.replace(/\s/g, ''));
  async function loadSlots() { const r = await A('slots?date=' + S.date); S.booked = r.booked || []; wizard(); }

  function wizard() {
    clearInterval(S.poll);
    const total = S.all.filter(s => S.svc.has(s.id)).reduce((a, s) => a + s.price, 0);
    const v = id => ($(id) || {}).value || '';
    let body = '', ok = true;
    if (S.step === 0) body = ['Desktop PC|🖥️ كمبيوتر مكتبي', 'Laptop|💻 لابتوب'].map(x => { const [k, t] = x.split('|'); return `<div class="wz-o ${S.device === k ? 'on' : ''} font-bold text-center" data-dev="${k}">${t}</div>`; }).join('');
    if (S.step === 1) { body = S.all.map(s => `<div class="wz-o ${S.svc.has(s.id) ? 'on' : ''}" data-svc="${E(s.id)}"><b class="text-sm">${E(s.title)}</b><div class="text-crimson font-mono text-xs mt-1">${E(s.price)} ج.م</div></div>`).join('') + `<div class="font-extrabold text-sm">الإجمالي: ${total} ج.م</div>`; ok = S.svc.size > 0; }
    if (S.step === 2) body = `<textarea id="w-desc" rows="5" class="custom-input text-sm">${E(S._desc ?? $('ai-diag-summary').textContent.trim())}</textarea>`;
    if (S.step === 3) {
      const days = getUpcomingDays(7);
      body = `<div class="flex gap-2 overflow-x-auto pb-1">${days.map(d => `<button type="button" data-day="${E(d.iso)}" class="wz-o !py-2 text-xs font-bold whitespace-nowrap ${S.date === d.iso ? 'on' : ''}">${E(d.label)}</button>`).join('')}</div><div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${TIME_SLOTS_10_TO_8.map(t => { const b = S.booked.includes(t.id); return `<button type="button" ${b ? 'disabled' : `data-slot="${t.id}"`} class="wz-o !py-2 text-xs font-bold ${S.slot === t.id ? 'on' : ''} ${b ? 'opacity-40 cursor-not-allowed' : ''}">${E(t.ar)}${b ? ' (محجوز)' : ''}</button>`; }).join('')}</div>`;
      ok = !!S.date && !!S.slot;
    }
    if (S.step === 4) { body = `<input id="w-name" class="custom-input" placeholder="الاسم الكامل" value="${E(S._n ?? LS.cname ?? '')}"><input id="w-phone" class="custom-input" dir="ltr" placeholder="01xxxxxxxxx" value="${E(S._p ?? LS.cphone ?? '')}"><div class="relative"><input id="w-addr" class="custom-input pl-16" placeholder="العنوان بالتفصيل" value="${E(S._a ?? LS.caddr ?? detectedInfo.locationString)}"><button type="button" id="w-gps" class="absolute left-2 top-2 bg-gray-200 text-xs font-bold px-2.5 py-1.5 rounded-lg">📍 GPS</button></div>`; ok = (S._n ?? LS.cname ?? '').length > 2 && phoneOk(S._p ?? LS.cphone ?? '') && (S._a ?? LS.caddr ?? detectedInfo.locationString).length > 4; }
    if (S.step === 5) { body = `<div class="text-sm leading-7 bg-gray-50 rounded-2xl p-4">${E(S._n)} — ${E(S._p)}<br>${E(S._a)}<br>${E(S.date)} • ${E(getSlotLabel(S.slot))}<br>${E(S.device)}<br><b>${E(S.all.filter(s => S.svc.has(s.id)).map(s => s.title).join(' + '))}</b><br><b class="text-crimson">${total} ج.م</b></div><label class="flex gap-2 text-sm"><input type="checkbox" id="w-ok" class="accent-rose-600"> أوافق على الشروط والأحكام وسياسة الخصوصية</label>`; ok = false; }
    sec.innerHTML = `<h2 class="text-2xl font-black text-center mb-4">اطلب في مكانك</h2><div class="flex gap-1 mb-5">${STEPS.map((_, i) => `<i class="flex-1 h-1.5 rounded ${i <= S.step ? 'bg-crimson' : 'bg-gray-200'}"></i>`).join('')}</div><div class="font-extrabold mb-3">${S.step + 1}. ${STEPS[S.step]}</div><div class="wz-p space-y-3" style="--d:${S.dir}">${body}</div><div class="flex gap-2 mt-6">${S.step ? '<button id="w-back" class="px-5 py-3 rounded-xl border font-bold">رجوع</button>' : ''}<button id="w-next" ${S.step === 5 ? 'disabled' : ok ? '' : 'disabled'} class="flex-1 bg-crimson text-white font-extrabold py-3 rounded-xl disabled:opacity-40">${S.step === 5 ? 'تأكيد الحجز' : 'التالي'}</button></div>`;
    sec.querySelectorAll('[data-dev]').forEach(e => e.onclick = () => { S.device = e.dataset.dev; wizard(); });
    sec.querySelectorAll('[data-svc]').forEach(e => e.onclick = () => { S.svc.has(e.dataset.svc) ? S.svc.delete(e.dataset.svc) : S.svc.add(e.dataset.svc); wizard(); });
    sec.querySelectorAll('[data-day]').forEach(e => e.onclick = () => { S.date = e.dataset.day; S.slot = ''; loadSlots(); });
    sec.querySelectorAll('[data-slot]').forEach(e => e.onclick = () => { S.slot = e.dataset.slot; wizard(); });
    if ($('w-desc')) $('w-desc').oninput = e => S._desc = e.target.value;
    ['name:_n:cname', 'phone:_p:cphone', 'addr:_a:caddr'].forEach(x => { const [i, k, l] = x.split(':'); if ($('w-' + i)) $('w-' + i).oninput = e => { S[k] = e.target.value; LS[l] = e.target.value; $('w-next').disabled = !((S._n ?? LS.cname ?? '').length > 2 && phoneOk(S._p ?? LS.cphone ?? '') && (S._a ?? LS.caddr ?? '').length > 4); }; });
    if ($('w-gps')) $('w-gps').onclick = () => navigator.geolocation && navigator.geolocation.getCurrentPosition(p => { S._a = `GPS (${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}) ${$('w-addr').value}`; wizard(); });
    if ($('w-ok')) $('w-ok').onchange = e => $('w-next').disabled = !e.target.checked;
    if ($('w-back')) $('w-back').onclick = () => go(S.step - 1);
    $('w-next').onclick = () => S.step < 5 ? ((S.step === 2 && (S._desc = $('w-desc').value)), (S.step === 4 && (S._n = S._n ?? LS.cname, S._p = S._p ?? LS.cphone, S._a = S._a ?? LS.caddr ?? detectedInfo.locationString)), go(S.step + 1)) : submit();
  }

  async function submit() {
    $('w-next').disabled = true;
    const r = await A('orders', { method: 'POST', body: { name: S._n, phone: S._p, address: S._a, date: S.date, slot: S.slot, device: S.device, services: [...S.svc], desc: S._desc || '', hardware: `${detectedInfo.mobo} | ${detectedInfo.cpu} | ${detectedInfo.gpu} | ${detectedInfo.ram}`, consent: true } });
    if (!r.ok) { showToast(r.error === 'slot_taken' ? 'الموعد اتحجز، اختر موعدًا آخر.' : 'تعذّر الحجز، راجع البيانات.'); if (r.error === 'slot_taken') { S.slot = ''; S.step = 3; loadSlots(); } else $('w-next').disabled = false; return; }
    LS.ckey = r.key; LS.cname = S._n; track();
  }

  async function track() {
    clearInterval(S.poll);
    const r = await A('my?key=' + LS.ckey); const list = r.list || [];
    if (!list.length) { delete LS.ckey; return start(); }
    const o = list.find(x => x.stage !== 'Completed' && x.stage !== 'Cancelled') || list.find(x => x.stage === 'Completed' && !x.fb) || list[0];
    const idx = ST.findIndex(x => x[0] === o.stage), fin = o.stage === 'Completed';
    sec.innerHTML = `<div class="wz-p space-y-4" style="--d:-1"><h2 class="text-2xl font-black text-center">أهلاً ${E(o.name.split(' ')[0])} 👋</h2><div class="text-center text-xs font-mono text-gray-500">${E(o.code)} • ${E(o.date)} • ${E(getSlotLabel(o.slot))}</div><ol class="space-y-2">${ST.map((x, i) => `<li class="flex items-center gap-3 p-3 rounded-xl ${i < idx || (fin && i === idx) ? 'bg-rose-50' : i === idx ? 'bg-rose-100 ring-2 ring-rose-400' : 'bg-gray-50 opacity-60'}"><span class="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${i <= idx ? 'bg-crimson' : 'bg-gray-300'}">${i <= idx ? '✓' : i + 1}</span><b class="text-sm">${x[1]}</b></li>`).join('')}</ol>${fin && !o.fb ? `<div class="border rounded-2xl p-4 space-y-2"><b>قيّم تجربتك</b><select id="f-r" class="custom-input"><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option></select><input id="f-c" class="custom-input" placeholder="اكتب تعليقك"><button id="f-go" class="w-full bg-crimson text-white font-bold py-2.5 rounded-xl">إرسال التقييم</button></div>` : ''}${fin ? '<button id="new" class="w-full border font-bold py-3 rounded-xl">حجز جديد</button>' : ''}</div>`;
    if ($('f-go')) $('f-go').onclick = async () => { const x = await A('feedback', { method: 'POST', body: { key: LS.ckey, code: o.code, rating: $('f-r').value, comment: $('f-c').value } }); showToast(x.ok ? 'شكرًا لتقييمك!' : 'تعذّر الإرسال.'); track(); };
    if ($('new')) $('new').onclick = start;
    if (!fin) S.poll = setInterval(track, 15000);
  }

  async function start() { const r = await A('services'); S.all = r.list || []; S.svc = new Set((db.services || []).filter(s => s.active && s.selected).map(s => s.id).filter(i => S.all.some(a => a.id === i))); S.step = 0; S.date = ''; S.slot = ''; wizard(); }
  LS.ckey ? track() : start();

  /* لوحة الأدمن والموظفين: الأوردرات والتوزيع والمراحل من السيرفر */
  window.renderStaffWorkspace = async () => {
    const b = $('staff-workspace-body'), s = currentStaffSession; if (!b || !s) return;
    $('staff-workspace-section').classList.remove('hidden');
    const adm = s.role === 'admin', [o, t] = await Promise.all([A('orders'), adm ? A('staff') : { list: [] }]);
    b.innerHTML = `<div class="bg-[#111117] rounded-3xl p-5 border border-gray-800 space-y-4"><h2 class="text-xl font-black">${E(s.name)} • ${adm ? 'الأدمن' : 'الفني'}</h2>${(o.list || []).map(x => `<div class="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-xs space-y-2"><div><b class="text-crimson font-mono">${E(x.code)}</b> ${E(x.name)} (${E(x.phone)})<br>📍 ${E(x.address)} • 📅 ${E(x.date)} ${E(getSlotLabel(x.slot))}<br>${E(x.services)} — ${E(x.total)} ج.م</div><div class="flex flex-wrap gap-2"><select data-st="${E(x.code)}" class="bg-gray-800 rounded-lg px-2 py-1.5">${ST.map(y => `<option value="${y[0]}" ${x.stage === y[0] ? 'selected' : ''}>${y[1]}</option>`).join('')}</select>${adm ? `<select data-as="${E(x.code)}" class="bg-gray-800 rounded-lg px-2 py-1.5"><option value="">بدون فني</option>${(t.list || []).map(u => `<option value="${u.id}" ${x.tech_id === u.id ? 'selected' : ''}>${E(u.name)}</option>`).join('')}</select>` : ''}</div></div>`).join('') || '<div class="text-gray-400 text-sm">لا توجد أوردرات.</div>'}${adm ? `<form id="st-f" class="bg-gray-900 rounded-2xl p-4 grid gap-2 text-xs"><b>إضافة موظف</b><input name="name" placeholder="الاسم" class="custom-input bg-gray-800 text-white" required><input name="username" placeholder="Username" dir="ltr" class="custom-input bg-gray-800 text-white" required><input name="password" type="password" placeholder="10 أحرف+ حرف كبير وصغير ورقم" dir="ltr" class="custom-input bg-gray-800 text-white" required><div class="flex gap-3"><label><input type="checkbox" name="p" value="orders" checked> الأوردرات</label><label><input type="checkbox" name="p" value="services"> الخدمات</label><label><input type="checkbox" name="p" value="content"> المحتوى</label></div><button class="bg-crimson text-white font-bold py-2 rounded-xl">إنشاء</button></form>` : ''}</div>`;
    b.querySelectorAll('[data-st]').forEach(e => e.onchange = async () => { const r = await A('orders/stage', { method: 'POST', body: { code: e.dataset.st, stage: e.value } }); showToast(r.ok ? 'تم تحديث المرحلة.' : 'غير مسموح.'); });
    b.querySelectorAll('[data-as]').forEach(e => e.onchange = async () => { const r = await A('orders/assign', { method: 'POST', body: { code: e.dataset.as, techId: e.value } }); showToast(r.ok ? 'تم التوزيع.' : 'تعذّر التوزيع.'); });
    if ($('st-f')) $('st-f').onsubmit = async ev => { ev.preventDefault(); const f = new FormData(ev.target); const r = await A('staff', { method: 'POST', body: { name: f.get('name'), username: f.get('username'), password: f.get('password'), perms: f.getAll('p') } }); showToast(r.ok ? 'تم إنشاء الموظف.' : 'تعذّر الإنشاء (راجع قوة الباسورد).'); renderStaffWorkspace(); };
  };
})();
