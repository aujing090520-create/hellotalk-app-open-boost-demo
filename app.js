const app = document.querySelector('#app');
const phone = document.querySelector('#phone');
const rulePanel = document.querySelector('#rulePanel');
const connectorLayer = document.querySelector('#connectorLayer');

const initialRecords = [
  { type: 'random', date: '08/18', shown: 500, visitors: 36, status: '投放完成', photoSource: 'avatar', style: 0 },
  { type: 'designated', date: '08/12', name: 'Mia', initial: 'M', className: 'mia', status: '已展示', detail: 'TA 已打开 App 并看到你的开屏封面', photoSource: 'album', style: 1 },
  { type: 'designated', date: '07/30', name: 'Noah', initial: 'N', className: 'noah', status: '未展示', detail: '48 小时内未打开 App', photoSource: 'avatar', style: 2 }
];

const styleNames = ['清透日常', '暖调胶片', '霓虹夜景', '柔光蜜粉'];

const rules = [
  { id: 'FR-001/1', text: '四个横向 Tab，开屏推荐复用加热中心页面结构。', target: 'tabs', view: 'main' },
  { id: 'FR-002/1', text: '顶部仅外显最新未结束任务。', target: 'banner', view: 'main' },
  { id: 'FR-003/1', text: '照片来源支持头像、拍照、相册。', target: 'cover', view: 'main' },
  { id: 'FR-003/2', text: '选择商品模版时可查看模版预览。', target: 'template', view: 'main', overlay: 'template' },
  { id: 'FR-004/3', text: '非 Plus 指定语伴置灰，点击引导开通。', target: 'designated', view: 'main' },
  { id: 'FR-005/1', text: '随机推荐提供 500 / 1000 / 2000 / 3000 四档。', target: 'packages', view: 'main' },
  { id: 'FR-005/4', text: '立即推荐是唯一提交动作。', target: 'purchase', view: 'main' },
  { id: 'FR-007/3', text: '指定语伴记录显示对象与投放状态。', target: 'records', view: 'main', overlay: 'records' },
  { id: 'FR-008/3', text: '随机记录展示已展示人数和去重访客数。', target: 'records', view: 'main', overlay: 'records' }
];

const state = {
  view: 'main',
  isPlus: true,
  review: false,
  overlay: null,
  overlayEntered: true,
  photoSelected: true,
  photoSource: 'avatar',
  templateSelected: true,
  template: 0,
  copy: 0,
  mode: 'random',
  selectedPackage: 500,
  selectedFriend: null,
  agreed: true,
  activeTasks: [],
  records: [...initialRecords],
  modeHelp: null,
  selectedRule: null
};

function statusBar() {
  return `<div class="statusbar"><span>15:07</span><div class="status-icons"><span class="signal"></span><span>◒</span><span class="battery"></span></div></div>`;
}

function backButton(target = 'main') {
  return `<button class="head-icon" data-action="nav" data-target="${target}" aria-label="返回">‹</button>`;
}

function anchor(target, number) {
  return `<i class="rule-anchor" data-rule-anchor="${target}" aria-hidden="true">${number}</i>`;
}

function taskCopy(task) {
  if (task.type === 'random') return { title: '正在推荐', detail: `已展示 ${task.shown} / ${task.total} 人` };
  return { title: '等待对方打开 App', detail: `${task.name} · 剩余 ${task.remaining} 小时` };
}

function renderMain() {
  const latest = state.activeTasks[0];
  const banner = latest ? (() => {
    const copy = taskCopy(latest);
    const progress = latest.type === 'random' ? `<i class="task-progress" aria-hidden="true"><b style="width:${Math.min(100, Math.round(latest.shown / latest.total * 100))}%"></b></i>` : '';
    return `<button class="task-banner" aria-label="查看进行中投放详情" data-action="nav" data-target="details" data-rule-target="banner">
      ${anchor('banner', '2')}<i class="banner-dot"></i><span class="banner-text"><strong>${copy.title}</strong><span>${copy.detail}</span>${progress}</span><i class="chevron">›</i>
    </button>`;
  })() : '';
  const hero = '<section class="open-cover-banner" aria-label="开屏推荐介绍"><div class="banner-portrait" aria-hidden="true"><b><i></i>HelloTalk</b><span class="banner-portrait-photo"></span><em><i>✦</i> 今日开屏人物</em></div><div class="open-cover-copy"><span>开屏推荐</span><strong>让新朋友<br>第一眼看见你</strong><p>打开 App，就有机会遇见你</p><i class="banner-benefit">专属开屏封面</i></div></section>';
  const ready = state.photoSelected && state.templateSelected;
  const designatedDisabled = !state.isPlus;
  const selectedFriend = state.selectedFriend;
  const canSubmit = ready && (state.mode === 'random' || !!selectedFriend) && state.agreed;
  const ctaAmount = state.mode === 'designated' ? 1000 : state.selectedPackage;
  const showCtaPrice = ready && (state.mode === 'random' || !!selectedFriend);
  const buttonText = !state.photoSelected ? '选择照片' : !state.templateSelected ? '选择风格' : '选择投放对象';
  const purchaseContent = showCtaPrice ? `<em class="vip-price-tag">VIP 专享价</em><span class="cta-price"><span class="cta-current"><i class="currency-mark">HT</i><b>${priceFor(ctaAmount)} 币</b></span><del>${listPriceFor(ctaAmount)} 币</del></span>` : buttonText;
  const purchaseLabel = state.mode === 'random'
    ? `<span>选择推荐人数</span><button class="purchase-help" data-action="mode-help" data-help="package-duration" aria-label="查看推荐时长说明"></button>${state.modeHelp === 'package-duration' ? '<span class="purchase-tip" role="tooltip">每500次最多推荐48小时，可重复叠加，到达时间后即自动结束推荐。</span>' : ''}`
    : `<span>选择投放对象</span><button class="purchase-help" data-action="mode-help" data-help="duration" aria-label="查看推荐时长说明"></button>${state.modeHelp === 'duration' ? '<span class="purchase-tip" role="tooltip">最多曝光48小时，到达时候后即自动结束推荐</span>' : ''}`;
  const packageHtml = state.mode === 'random' ? `<div class="package-grid" data-rule-target="packages">${anchor('packages', '5')}${[500,1000,2000,3000].map(amount => `<button class="package ${state.selectedPackage === amount ? 'is-selected' : ''}" data-action="package" data-amount="${amount}">${amount}<small>${amount === 500 ? '基础价' : amount === 1000 ? '省 16%' : amount === 2000 ? '省 20%' : '省 24%'}</small></button>`).join('')}</div>` : `<button class="designated-bar" data-action="open-friends">${selectedFriend ? `<span class="avatar ${selectedFriend.className}">${selectedFriend.initial}</span>` : '<span class="select-partner-icon" aria-hidden="true"><i>+</i></span>'}<span>${selectedFriend ? `指定给 ${selectedFriend.name}` : '请选择投放对象'}</span><strong style="margin-left:auto;color:var(--open-primary)">${priceFor(1000)} 币</strong><i class="chevron">›</i></button>`;

  return `${statusBar()}<section class="screen main-screen">
    <header class="boost-head"><button class="boost-close" data-action="close" aria-label="关闭">×</button><h2>加热中心</h2></header>
    <nav class="top-tabs" data-rule-target="tabs">${anchor('tabs', '1')}<button>帖子加热</button><button>超级曝光</button><button>聊天置顶</button><button class="is-active">开屏推荐</button></nav>
    <main class="main-content">
      ${banner}
      ${hero}
      <section class="section"><div class="card setting-card" data-rule-target="cover">${anchor('cover', '3')}<button class="setting-row" data-action="photo-sheet"><span><strong>选择照片</strong><small>${state.photoSelected ? (state.photoSource === 'avatar' ? '已选择头像' : '已选择照片') : '使用头像或从相册选择'}</small></span><i class="setting-thumb ${state.photoSelected ? (state.photoSource === 'avatar' ? 'photo is-avatar' : 'photo is-photo') : ''}"></i><i class="chevron">›</i></button><button class="setting-row" data-action="open-template"><span><strong>选择风格</strong><small>${styleNames[state.template]}</small></span><i class="template-thumb style-${state.template}"></i><i class="chevron">›</i></button></div></section>
      <section class="section"><div class="card delivery-card"><div class="card-title-line"><h3 class="setting-card-title">投放方式</h3><button class="history-link" data-action="open-records">投放记录 ›</button></div><div class="mode-grid"><div class="mode-option"><button class="mode-card ${state.mode === 'random' ? 'is-selected' : ''}" data-action="mode" data-mode="random"><strong>随机推荐</strong></button><button class="mode-help" data-action="mode-help" data-help="random" aria-label="查看随机推荐说明"></button>${state.modeHelp === 'random' ? '<div class="mode-tip" role="tooltip">按照你的语言进行算法推荐</div>' : ''}</div><div class="mode-option"><button class="mode-card ${state.mode === 'designated' ? 'is-selected' : ''} ${designatedDisabled ? 'is-disabled' : ''}" data-action="mode" data-mode="designated" data-rule-target="designated">${anchor('designated', '4')}<strong>指定语伴</strong>${designatedDisabled ? '<em class="vip-plus-badge" aria-label="VIP Plus">VIP<span>+</span></em>' : ''}</button><button class="mode-help" data-action="mode-help" data-help="designated" aria-label="查看指定语伴说明"></button>${state.modeHelp === 'designated' ? '<div class="mode-tip mode-tip-right" role="tooltip">选择一名与你互相关注的语伴</div>' : ''}</div></div></div></section>
    </main>
    <footer class="purchase-bar"><p class="purchase-label">${purchaseLabel}</p>${packageHtml}<button class="agreement" data-action="agreement"><i class="check ${state.agreed ? 'is-checked' : ''}">${state.agreed ? '✓' : ''}</i>我已阅读并同意<a>《开屏推荐协议》</a></button><button class="primary ${showCtaPrice ? 'has-price' : ''}" ${canSubmit ? '' : 'disabled'} data-action="submit" data-rule-target="purchase">${anchor('purchase', '6')}${purchaseContent}</button></footer>
  </section>`;
}

function renderTemplateSheet() {
  const copies = ['嘿，很高兴见到你！人生总要有几次主动，何不从现在开始？', '愿你今天的心情，也和这次相遇一样明亮。', '第一眼很短，认识你可以很长。'];
  return `<div class="overlay template-overlay"><section class="template-sheet${state.overlayEntered ? '' : ' is-entering'}" role="dialog" aria-modal="true" aria-labelledby="template-sheet-title"><i class="sheet-handle"></i><header class="template-sheet-head"><h2 id="template-sheet-title">选择风格</h2><button data-action="overlay-close" aria-label="关闭">×</button></header><main class="template-sheet-content">
    <section class="template-preview" data-rule-target="template">${anchor('template', '4')}<div class="splash-art-preview"><i class="selected-photo style-${state.template}"></i><i class="sparkle sparkle-large">✦</i><i class="sparkle sparkle-small">✦</i><span class="art-note">图片仅用于展示头像风格，最终以生成结果为准</span></div><div class="preview-copy"><strong>${copies[state.copy]}</strong><button data-action="refresh-copy"><i>↻</i> 换一换</button></div></section>
    <section class="section style-section"><div class="style-heading"><div><h3 class="section-label">选择图片风格</h3><p class="style-name">${styleNames[state.template]}</p></div><span>同一照片 · 不同风格</span></div><div class="template-rail">${styleNames.map((name, index) => `<button class="template style-${index} ${state.template === index ? 'is-selected' : ''}" data-action="template" data-template="${index}" aria-label="${name}"><i class="template-visual"></i></button>`).join('')}</div></section>
  </main><footer class="template-sheet-footer"><button class="primary" data-action="cover-done">完成</button></footer></section></div>`;
}

function renderFriends() {
  const friends = [
    { name: 'Mia', initial: 'M', className: 'mia', active: false, note: '超过 3 天未登录' },
    { name: 'Noah', initial: 'N', className: 'noah', active: true, note: '刚刚在线' },
    { name: 'Ava', initial: 'A', className: '', active: true, note: '10 分钟前在线' }
  ];
  return `${statusBar()}<section class="screen subpage"><header class="page-head">${backButton()}<h2>选择指定语伴</h2><span class="head-icon"></span></header><main class="sub-content"><input class="friend-search" placeholder="搜索互关语伴" aria-label="搜索互关语伴" /><div class="friend-list">${friends.map(friend => `<button class="friend" data-action="friend" data-name="${friend.name}" data-initial="${friend.initial}" data-class="${friend.className}" data-active="${friend.active}"><span class="avatar ${friend.className}">${friend.initial}</span><span class="friend-info"><strong>${friend.name}</strong><span>${friend.note}</span></span><i class="${friend.active ? 'online' : 'offline'}"></i><i class="chevron">›</i></button>`).join('')}</div></main></section>`;
}

function renderDetails() {
  return `${statusBar()}<section class="screen subpage"><header class="page-head">${backButton()}<h2>投放详情</h2><button class="right-link" data-action="open-records">投放记录 ›</button></header><main><section class="section"><h3 class="section-label" style="padding:0 16px">进行中（${state.activeTasks.length}）</h3><div class="detail-list">${state.activeTasks.length ? state.activeTasks.map(task => { const copy = taskCopy(task); return `<div class="task-row"><i class="task-thumb"></i><span class="task-info"><strong>${task.type === 'random' ? '随机推荐' : `指定给 ${task.name}`}</strong><span>${copy.detail}</span></span><em class="status-pill">${copy.title}</em></div>`; }).join('') : '<div class="empty">暂无进行中任务</div>'}</div></section></main></section>`;
}

function renderRecords() {
  return `${statusBar()}<section class="screen subpage"><header class="page-head">${backButton()}<h2>投放记录</h2><span class="head-icon"></span></header><main><section class="section"><div class="record-list" data-rule-target="records">${anchor('records', '7')}<span style="position:absolute;right:8px;top:39px">${anchor('records', '8')}</span>${state.records.map(record => `<div class="task-row"><i class="${record.type === 'designated' ? `avatar ${record.name === 'Mia' ? 'mia' : 'noah'}` : 'task-thumb'}">${record.type === 'designated' ? record.name[0] : ''}</i><span class="task-info"><strong>${record.title}</strong><span>${record.detail}</span></span><em class="status-pill">${record.status}</em></div>`).join('')}</div></section></main></section>`;
}

function renderHistorySheet() {
  const coverConfig = (record) => `<div class="history-cover-config"><i class="history-cover-preview ${record.photoSource === 'album' ? `is-album style-${record.style}` : 'is-avatar'}"></i><span><small>开屏封面</small><strong>${record.photoSource === 'album' ? '照片' : '头像'} · ${styleNames[record.style]}</strong></span></div>`;
  const recordCard = (record) => record.type === 'random'
    ? `<article class="history-card history-random"><header><time>${record.date}</time><span class="history-mode">随机推荐</span><em>${record.status}</em></header>${coverConfig(record)}<div class="history-metrics"><div><span>已展示人数</span><strong>${record.shown}</strong><small>人</small></div><div><span>访客数</span><strong>${record.visitors}</strong><small>人</small></div></div><footer><button class="history-copy" data-action="copy-record">复制本次条件</button><button class="history-repeat" data-action="repeat-random">再次推荐</button></footer></article>`
    : `<article class="history-card history-designated"><header><time>${record.date}</time><span class="history-mode">指定语伴</span><em class="${record.status === '已展示' ? 'is-success' : 'is-muted'}">${record.status}</em></header>${coverConfig(record)}<div class="history-partner"><span class="avatar ${record.className}">${record.initial}</span><div><span>展示对象</span><strong>${record.name}</strong></div><i></i><div><span>投放状态</span><strong>${record.status}</strong></div></div><p>${record.detail}</p><footer><button class="history-copy" data-action="copy-record">复制本次条件</button><button class="history-repeat" data-action="repeat-designated" data-name="${record.name}" data-initial="${record.initial}" data-class="${record.className}">再次推荐</button></footer></article>`;
  return `<div class="overlay history-overlay"><section class="history-sheet${state.overlayEntered ? '' : ' is-entering'}" role="dialog" aria-modal="true" aria-labelledby="history-sheet-title"><i class="sheet-handle"></i><header class="history-sheet-head"><button data-action="overlay-close" aria-label="关闭">×</button><h2 id="history-sheet-title">投放记录</h2><span></span></header><main class="history-list" data-rule-target="records">${anchor('records', '7')}${anchor('records', '8')}${state.records.map(recordCard).join('')}</main></section></div>`;
}

function overlay() {
  if (!state.overlay) return '';
  const enterClass = state.overlayEntered ? '' : ' is-entering';
  if (state.overlay === 'template') return renderTemplateSheet();
  if (state.overlay === 'records') return renderHistorySheet();
  if (state.overlay === 'photo') return `<div class="overlay"><div class="sheet${enterClass}"><i class="sheet-handle"></i><h3>请选择照片</h3><button class="sheet-action" data-action="photo-select" data-source="avatar">使用头像</button><button class="sheet-action" data-action="photo-select" data-source="album">拍照/相册</button><button class="sheet-action sheet-cancel" data-action="overlay-close">取消</button></div></div>`;
  if (state.overlay === 'preview') return `<div class="overlay"><div class="dialog${enterClass}"><h3>商品模版预览</h3><div class="mini-cover" style="margin:14px 0 12px">第一眼很短，认识你可以很长。</div><p>实际开屏文案会按接收者的界面语言展示。</p><div class="dialog-actions"><button class="confirm" data-action="overlay-close">知道了</button></div></div></div>`;
  if (state.overlay === 'plus') return `<div class="overlay"><div class="dialog${enterClass}"><h3>指定语伴为 Plus 专享</h3><p>开通 Plus 后，可付费让 1 位互关语伴在打开 App 时第一眼看到你。</p><div class="dialog-actions"><button class="secondary" data-action="overlay-close">暂不</button><button class="confirm" data-action="overlay-close">开通 Plus</button></div></div></div>`;
  if (state.overlay === 'inactive') return `<div class="overlay"><div class="dialog${enterClass}"><h3>${state.pendingFriend?.name || '这位语伴'} 已超过 3 天未登录</h3><p>${state.pendingFriend?.name || '对方'} 下次打开 App 时将看到你的开屏封面。48 小时内未打开，推荐自动结束。</p><div class="dialog-actions"><button class="secondary" data-action="overlay-close">换一位语伴</button><button class="confirm" data-action="confirm-inactive">仍然选择</button></div></div></div>`;
  if (state.overlay === 'created') return `<div class="overlay"><div class="dialog${enterClass}"><h3>已开始生成开屏封面</h3><p>完成后将自动开始推荐，你可在开屏推荐顶部查看状态。</p><div class="dialog-actions"><button class="confirm" data-action="overlay-close">知道了</button></div></div></div>`;
  return '';
}

function render() {
  let html = '';
  if (state.view === 'friends') html = renderFriends();
  else if (state.view === 'details') html = renderDetails();
  else if (state.view === 'records') html = renderRecords();
  else html = renderMain();
  app.className = `app ${state.review ? 'is-review' : ''}`;
  app.innerHTML = html + overlay();
  requestAnimationFrame(drawConnectors);
}

function priceFor(amount) {
  return ({ 500: 590, 1000: 990, 2000: 1890, 3000: 2690 })[amount];
}

function listPriceFor(amount) {
  return ({ 500: 690, 1000: 1190, 2000: 2390, 3000: 3590 })[amount];
}

function setView(view) { state.view = view; state.overlay = null; state.overlayEntered = true; render(); }

function showOverlay(type) {
  state.overlay = type;
  state.overlayEntered = false;
  render();
  requestAnimationFrame(() => { state.overlayEntered = true; });
}

function addTask(type) {
  const task = type === 'designated'
    ? { id: Date.now(), type: 'designated', name: 'Mia', shown: 0, remaining: 42, photoSource: state.photoSource, style: state.template }
    : { id: Date.now(), type: 'random', total: state.selectedPackage || 500, shown: 128, remaining: 42, photoSource: state.photoSource, style: state.template };
  state.activeTasks.unshift(task);
}

function finishLatest() {
  const task = state.activeTasks.shift();
  if (!task) return;
  if (task.type === 'random') {
    state.records.unshift({ type: 'random', date: '刚刚', shown: task.shown, visitors: Math.max(1, Math.round(task.shown * .07)), status: task.shown >= task.total ? '投放完成' : '投放结束', photoSource: task.photoSource, style: task.style });
  } else {
    state.records.unshift({ type: 'designated', date: '刚刚', name: task.name, initial: task.name[0], className: task.name === 'Mia' ? 'mia' : 'noah', detail: 'TA 已打开 App 并看到你的开屏封面', status: '已展示', photoSource: task.photoSource, style: task.style });
  }
}

app.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.classList.contains('overlay')) {
    state.overlay = null;
    state.overlayEntered = true;
    render();
    return;
  }
  const element = event.target.closest('[data-action], [data-rule-anchor]');
  if (!element) { if (state.modeHelp) { state.modeHelp = null; render(); } return; }
  if (element.dataset.ruleAnchor) { selectRuleByTarget(element.dataset.ruleAnchor); return; }
  const action = element.dataset.action;
  if (action === 'mode-help') { state.modeHelp = state.modeHelp === element.dataset.help ? null : element.dataset.help; render(); return; }
  if (action === 'nav') setView(element.dataset.target);
  if (action === 'open-records') showOverlay('records');
  if (action === 'copy-record') { state.overlay = null; state.overlayEntered = true; render(); }
  if (action === 'repeat-random') { state.mode = 'random'; state.selectedFriend = null; state.overlay = null; state.overlayEntered = true; render(); }
  if (action === 'repeat-designated') { state.mode = 'designated'; state.selectedFriend = { name: element.dataset.name, initial: element.dataset.initial, className: element.dataset.class }; state.overlay = null; state.overlayEntered = true; render(); }
  if (action === 'close') { state.view = 'main'; render(); }
  if (action === 'mode') {
    if (element.dataset.mode === 'designated' && !state.isPlus) { showOverlay('plus'); return; }
    else { state.mode = element.dataset.mode; state.modeHelp = null; if (state.mode === 'random') state.selectedFriend = null; }
    render();
  }
  if (action === 'package') { state.selectedPackage = Number(element.dataset.amount); render(); }
  if (action === 'agreement') { state.agreed = !state.agreed; render(); }
  if (action === 'photo-sheet') showOverlay('photo');
  if (action === 'open-template') showOverlay('template');
  if (action === 'photo-select') { state.photoSelected = true; state.photoSource = element.dataset.source || 'avatar'; state.overlay = null; render(); }
  if (action === 'template') { state.template = Number(element.dataset.template); render(); }
  if (action === 'copy') { state.copy = Number(element.dataset.copy); render(); }
  if (action === 'refresh-copy') { state.copy = (state.copy + 1) % 3; render(); }
  if (action === 'preview-template') showOverlay('preview');
  if (action === 'cover-done') { state.templateSelected = true; state.overlay = null; render(); }
  if (action === 'open-friends') setView('friends');
  if (action === 'friend') {
    const friend = { name: element.dataset.name, initial: element.dataset.initial, className: element.dataset.class };
    if (element.dataset.active === 'false') { state.pendingFriend = friend; showOverlay('inactive'); }
    else { state.selectedFriend = friend; setView('main'); }
  }
  if (action === 'confirm-inactive') { state.selectedFriend = state.pendingFriend; state.pendingFriend = null; setView('main'); }
  if (action === 'submit') {
    if (!state.photoSelected) { showOverlay('photo'); return; }
    if (!state.templateSelected) { showOverlay('template'); return; }
    if (state.mode === 'designated' && !state.selectedFriend) { setView('friends'); return; }
    if (!state.agreed) { render(); return; }
    addTask(state.mode); showOverlay('created');
  }
  if (action === 'overlay-close') { state.overlay = null; state.overlayEntered = true; render(); }
});

document.querySelector('#reviewToggle').addEventListener('change', (event) => {
  state.review = event.target.checked;
  state.selectedRule = null;
  rulePanel.hidden = !state.review;
  renderRules();
  render();
});

document.querySelectorAll('[data-control]').forEach(button => button.addEventListener('click', () => {
  const control = button.dataset.control;
  if (control === 'plus' || control === 'normal') {
    state.isPlus = control === 'plus';
    document.querySelectorAll('.control-choice').forEach(item => item.classList.toggle('is-active', item === button));
    if (!state.isPlus && state.mode === 'designated') state.mode = 'random';
  }
  if (control === 'create-random') addTask('random');
  if (control === 'create-designated') addTask('designated');
  if (control === 'finish-latest') finishLatest();
  render();
}));

function renderRules() {
  if (!state.review) { rulePanel.innerHTML = ''; return; }
  rulePanel.innerHTML = `<p class="rule-title">FR 规则映射</p>${rules.map(rule => `<button class="rule-card ${state.selectedRule === rule.id ? 'is-selected' : ''}" data-rule-card="${rule.id}"><strong>${rule.id}</strong>${rule.text}</button>`).join('')}`;
  rulePanel.querySelectorAll('[data-rule-card]').forEach(card => card.addEventListener('click', () => {
    const rule = rules.find(item => item.id === card.dataset.ruleCard);
    state.selectedRule = rule.id;
    if (state.view !== rule.view) state.view = rule.view;
    state.overlay = rule.overlay || null;
    state.overlayEntered = !rule.overlay;
    renderRules();
    render();
    if (rule.overlay) requestAnimationFrame(() => { state.overlayEntered = true; });
    requestAnimationFrame(() => selectRuleByTarget(rule.target, false));
  }));
}

function selectRuleByTarget(target, shouldUpdate = true) {
  const rule = rules.find(item => item.target === target);
  if (!rule) return;
  if (shouldUpdate) { state.selectedRule = rule.id; renderRules(); }
  const card = rulePanel.querySelector(`[data-rule-card="${rule.id}"]`);
  const node = app.querySelector(`[data-rule-target="${target}"]`);
  if (card) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  if (node) {
    node.animate([{ boxShadow: '0 0 0 0 rgba(112,71,245,0)' }, { boxShadow: '0 0 0 4px rgba(112,71,245,.2)' }, { boxShadow: '0 0 0 0 rgba(112,71,245,0)' }], { duration: 700, easing: 'ease-out' });
  }
  requestAnimationFrame(drawConnectors);
}

function drawConnectors() {
  connectorLayer.innerHTML = '';
  if (!state.review || window.innerWidth <= 770) return;
  const panelRect = rulePanel.getBoundingClientRect();
  if (!panelRect.width) return;
  rules.forEach(rule => {
    const card = rulePanel.querySelector(`[data-rule-card="${rule.id}"]`);
    const target = app.querySelector(`[data-rule-anchor="${rule.target}"]`);
    if (!card || !target) return;
    const from = card.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const x1 = from.left, y1 = from.top + from.height / 2, x2 = to.left + to.width / 2, y2 = to.top + to.height / 2;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'connector-line');
    path.setAttribute('d', `M ${x1} ${y1} C ${x1 - 70} ${y1}, ${x2 + 70} ${y2}, ${x2} ${y2}`);
    connectorLayer.appendChild(path);
  });
}

window.addEventListener('resize', () => requestAnimationFrame(drawConnectors));
render();
