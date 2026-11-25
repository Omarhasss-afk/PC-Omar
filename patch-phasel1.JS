/* ضعه في آخر index.html، بعد سكربت التطبيق مباشرة:  <script src="patch-phase1.js"></script>
   لا يغيّر الهيكل الأصلي؛ يستبدل دوال محددة فقط. */
(() => {
  const api = (p, o = {}) => fetch('/api/' + p, { credentials: 'same-origin', headers: { 'content-type': 'application/json' }, ...o, body: o.body && JSON.stringify(o.body) }).then(r => r.json().then(j => ({ ok: r.ok, ...j })));

  /* 1) إلغاء زر التخطي نهائيًا */
  const sk = document.getElementById('scan-skip'); if (sk) sk.remove();
  window.skipScan = () => {};

  /* 2) إخفاء زر دخول الفريق من الفوتر (يبقى #admin و #tech و Ctrl+Shift+S) */
  document.querySelectorAll('footer button').forEach(b => { if (/openStaffLoginModal/.test(b.getAttribute('onclick') || '')) b.parentElement.classList.add('hidden'); });

  /* 3) نافذة الدخول: بدون تعبئة تلقائية وبدون عرض أي بيانات */
  const oldSwitch = window.switchStaffLoginTab;
  window.switchStaffLoginTab = tab => {
    oldSwitch(tab);
    document.getElementById('staff-credentials-box').innerHTML = '<a href="#" id="forgot-pw" class="text-rose-300 underline">نسيت كلمة المرور؟ (كود على رقم المالك)</a>';
    ['staff-username', 'staff-password'].forEach(i => { const e = document.getElementById(i); e.value = ''; e.autocomplete = 'off'; });
    document.getElementById('forgot-pw').onclick = async e => {
      e.preventDefault(); await api('reset/request', { method: 'POST', body: {} });
      const code = prompt('أُرسل كود من 6 أرقام لرقم المالك. أدخله:'); if (!code) return;
      const np = prompt('كلمة مرور جديدة (10 أحرف+، حرف كبير وصغير ورقم):'); if (!np) return;
      const r = await api('reset/confirm', { method: 'POST', body: { code, newPassword: np } });
      showToast(r.ok ? 'تم تغيير كلمة المرور.' : 'الكود أو كلمة المرور غير صالحين.');
    };
  };

  /* 4) الدخول عبر السيرفر (لا مقارنة كلمات مرور في المتصفح) */
  window.handleStaffLogin = async e => {
    e.preventDefault();
    const r = await api('login', { method: 'POST', body: { username: staffUsername.value.trim(), password: staffPassword.value } });
    if (!r.ok) return showToast(r.error === 'locked' ? 'تم القفل مؤقتًا. حاول بعد 15 دقيقة.' : 'بيانات الدخول غير صحيحة.');
    currentStaffSession = { role: r.role, userId: r.role === 'admin' ? 'ADMIN-1' : r.name, username: staffUsername.value.trim(), name: r.name || 'Admin', zone: '' };
    staffPassword.value = ''; closeStaffLoginModal(); updateStaffChip(); openStaffWorkspace();
  };
  window.logoutStaff = async () => { await api('logout', { method: 'POST', body: {} }); currentStaffSession = null; updateStaffChip(); document.getElementById('staff-workspace-section').classList.add('hidden'); };

  /* 5) موافقة واحدة ثم الباور يبدأ الاختبار مباشرة (بدون نافذة السكربت) */
  const consentOk = () => sessionStorage.getItem('consent') === '1';
  function askConsent() {
    return new Promise(res => {
      const d = document.createElement('div');
      d.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4';
      d.innerHTML = '<div class="bg-[#111117] text-white border border-gray-800 rounded-3xl max-w-md w-full p-6"><h3 class="font-black text-lg mb-2">الموافقة على الشروط والخصوصية</h3><p class="text-sm text-gray-300 mb-4">سنقرأ مواصفات جهازك وقراءاته أثناء الاختبار ونرسل التقرير للفني لتنفيذ الخدمة فقط، ولا نغيّر أي شيء على جهازك.</p><label class="flex gap-2 text-sm mb-4"><input type="checkbox" id="c-ok" class="accent-rose-600"> أوافق على الشروط والأحكام وسياسة الخصوصية</label><button id="c-go" disabled class="w-full bg-crimson disabled:opacity-40 text-white font-extrabold py-3 rounded-xl">ابدأ الفحص</button></div>';
      document.body.appendChild(d);
      d.querySelector('#c-ok').onchange = e => d.querySelector('#c-go').disabled = !e.target.checked;
      d.querySelector('#c-go').onclick = () => { sessionStorage.setItem('consent', '1'); d.remove(); res(); };
    });
  }
  window.powerClick = async () => {
    if (!isTesting && !consentOk()) await askConsent();
    if (!isTesting) HW.verified = true;
    toggleTest();
  };

  /* 6) إخفاء إحساس الوقت: نص ثابت وحلقة ثابتة طول الاختبار */
  setInterval(() => {
    if (!isTesting) return;
    const l = document.getElementById('status-label'); if (l && l.textContent !== 'DIAGNOSTIC IN PROGRESS') l.textContent = 'DIAGNOSTIC IN PROGRESS';
    document.getElementById('power-ring').style.background = 'conic-gradient(#FF1E38 0deg, rgba(225,29,72,.25) 0deg)';
  }, 100);

  /* 7) التقرير يُرسل تلقائيًا للمالك عبر الـ API بدل فتح wa.me */
  window.sendReportWhatsApp = async reason => {
    const r = await api('report', { method: 'POST', body: { text: buildWhatsAppReportText(reason || lastTestOutcome), consent: consentOk() } });
    const bar = document.getElementById('report-summary-text'); if (bar) bar.textContent = r.ok ? 'تم إرسال التقرير للفني.' : 'تعذّر إرسال التقرير، سنتواصل معك.';
  };
})();
