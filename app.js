const app = document.querySelector('#app');
const phone = document.querySelector('#phone');
const rulePanel = document.querySelector('#rulePanel');
const connectorLayer = document.querySelector('#connectorLayer');
const backendConsole = document.querySelector('#backendConsole');
const demoVersion = new URLSearchParams(window.location.search).get('v') || '';
const completionStorageKey = 'hellotalk-open-boost-completion-notice';

function readCompletionNotice() {
  try {
    const value = window.localStorage.getItem(completionStorageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function persistCompletionNotice(notice) {
  try {
    if (notice) window.localStorage.setItem(completionStorageKey, JSON.stringify(notice));
    else window.localStorage.removeItem(completionStorageKey);
  } catch {
    // Demo 在禁用本地存储的环境中仍可正常展示当前会话状态。
  }
}

const initialRecords = [
  { type: 'random', date: '08/18', shown: 500, visitors: 36, status: '投放完成', photoSource: 'avatar', style: 0 },
  { type: 'designated', date: '08/12', name: 'Mia', initial: 'M', className: 'mia', status: '已展示', detail: '对方已打开 App 并看到你的开屏封面', photoSource: 'album', style: 1 },
  { type: 'designated', date: '07/30', name: 'Noah', initial: 'N', className: 'noah', status: '未展示', detail: '48 小时内未打开 App', photoSource: 'avatar', style: 2 }
];

const styleNames = ['清透日常', '暖调胶片', '霓虹夜景', '柔光蜜粉'];

// Demo 中的“后台返回数据”。商品主数据和前台外显配置分开，和真实后台的职责保持一致。
const productCatalog = {
  random: [
    { id: 'open-r-500', name: '500 次推荐', recommendCount: 500, exposureCount: 500, price: 590, listPrice: 690, displayPrice: 690, firstPrice: 590, actualPrice: 590, vipPrice: 590, enabled: true },
    { id: 'open-r-1000', name: '1000 次推荐', recommendCount: 1000, exposureCount: 1000, price: 990, listPrice: 1190, displayPrice: 1190, firstPrice: 990, actualPrice: 990, vipPrice: 990, enabled: true },
    { id: 'open-r-2000', name: '2000 次推荐', recommendCount: 2000, exposureCount: 2000, price: 1890, listPrice: 2390, displayPrice: 2390, firstPrice: 1890, actualPrice: 1890, vipPrice: 1890, enabled: true },
    { id: 'open-r-3000', name: '3000 次推荐', recommendCount: 3000, exposureCount: 3000, price: 2690, listPrice: 3590, displayPrice: 3590, firstPrice: 2690, actualPrice: 2690, vipPrice: 2690, enabled: true }
  ],
  designated: [
    { id: 'open-d-1', name: '指定 1 位语伴', recommendCount: 1, exposureCount: 1, price: 99, listPrice: 119, displayPrice: 119, firstPrice: 99, actualPrice: 99, vipPrice: 99, enabled: true }
  ]
};

const placementConfig = {
  random: { productIds: ['open-r-500', 'open-r-1000', 'open-r-2000', 'open-r-3000'], defaultId: 'open-r-500' },
  designated: { productIds: ['open-d-1'], defaultId: 'open-d-1' }
};

const productGroups = {
  random: [{ id: 'group-r-1', category: '开屏推荐', name: '随机推荐默认商品组', description: '随机推荐商品组', productIds: [...placementConfig.random.productIds] }],
  designated: [{ id: 'group-d-1', category: '开屏推荐', name: '指定语伴默认商品组', description: '指定语伴商品组', productIds: [...placementConfig.designated.productIds] }]
};
const defaultGroupIds = { random: 'group-r-1', designated: 'group-d-1' };

const rules = [
  { id: 'FR-001/1', text: '四个横向 Tab，开屏推荐复用加热中心页面结构。', target: 'tabs', view: 'main' },
  { id: 'FR-002/1', text: '顶部仅外显最新未结束任务。', target: 'banner', view: 'main' },
  { id: 'FR-003/1', text: '照片来源支持头像、拍照、相册。', target: 'cover', view: 'main' },
  { id: 'FR-003/2', text: '选择商品模版时可查看模版预览。', target: 'template', view: 'main', overlay: 'template' },
  { id: 'FR-004/3', text: '指定语伴对所有用户开放，最多可选 10 位；可作为全站推荐的增值投放或单独投放，且不占用全站推荐人数。', target: 'designated', view: 'main' },
  { id: 'FR-005/1', text: '随机推荐提供 500 / 1000 / 2000 / 3000 四档。', target: 'packages', view: 'main' },
  { id: 'FR-005/4', text: '立即推荐是唯一提交动作。', target: 'purchase', view: 'main' },
  { id: 'FR-007/3', text: '指定语伴记录按一次投放汇总多位对象，并展示每位语伴的投放状态。', target: 'records', view: 'main', overlay: 'records' },
  { id: 'FR-008/3', text: '全站推荐记录展示已展示人数和去重访客数；若同时指定语伴，附带指定结果摘要。', target: 'records', view: 'main', overlay: 'records' }
];

const state = {
  view: 'main',
  review: false,
  overlay: null,
  overlayEntered: true,
  photoSelected: true,
  photoSource: 'avatar',
  templateSelected: true,
  template: 0,
  copy: 0,
  mode: 'random',
  audience: 'default',
  selectedProductIds: { random: 'open-r-500', designated: 'open-d-1' },
  backendType: 'random',
  adminPage: demoVersion.includes('placement-group') ? 'placement' : 'products',
  adminDialog: null,
  adminDialogType: null,
  adminPlacementDialog: null,
  adminPlacementDraftIds: [],
  adminPlacementDraft: { name: '', description: '', category: '开屏推荐' },
  selectedFriend: null,
  selectedFriends: [],
  friendDraft: [],
  customGender: '全部',
  agreed: true,
  activeTasks: [],
  records: [...initialRecords],
  completionNotice: readCompletionNotice(),
  modeHelp: null,
  previewItem: null,
  previewOrigin: null,
  previewSaved: false,
  audienceTask: null,
  audienceOrigin: null,
  audienceTab: 'shown',
  placementDetail: null,
  partnerInfo: null,
  partnerStatusItems: [],
  partnerStatusOrigin: null,
  adminRecordFilters: { type: 'all', status: 'all', date: 'all' },
  adminImportDialog: false,
  adminImportText: '',
  selectedRule: null
};

if (state.completionNotice) state.overlay = 'completion';

function statusBar() {
  return `<div class="statusbar"><span>15:07</span><div class="status-icons"><span class="signal"></span><span>◒</span><span class="battery"></span></div></div>`;
}

function backButton(target = 'main') {
  return `<button class="head-icon" data-action="nav" data-target="${target}" aria-label="返回">‹</button>`;
}

function anchor(target, number) {
  return `<i class="rule-anchor" data-rule-anchor="${target}" aria-hidden="true">${number}</i>`;
}

function productById(type, id) {
  return productCatalog[type].find(product => product.id === id);
}

function visibleProducts(type) {
  return placementConfig[type].productIds
    .map(id => productById(type, id))
    .filter(product => product?.enabled);
}

function normalizePlacement(type) {
  const max = type === 'random' ? 4 : 1;
  const catalogIds = new Set(productCatalog[type].filter(product => product.enabled).map(product => product.id));
  placementConfig[type].productIds = placementConfig[type].productIds.filter(id => catalogIds.has(id)).slice(0, max);
  if (!placementConfig[type].productIds.includes(placementConfig[type].defaultId)) {
    placementConfig[type].defaultId = placementConfig[type].productIds[0] || null;
  }
  const selectedId = state.selectedProductIds[type];
  if (!placementConfig[type].productIds.includes(selectedId)) {
    state.selectedProductIds[type] = placementConfig[type].defaultId;
  }
}

function selectedProduct(type) {
  normalizePlacement(type);
  const selected = productById(type, state.selectedProductIds[type]);
  return selected && selected.enabled && placementConfig[type].productIds.includes(selected.id)
    ? selected
    : visibleProducts(type)[0] || null;
}

function savingText(product) {
  if (!product) return '';
  if (product.recommendCount === 500) return '基础价';
  const discount = Math.round((1 - product.price / product.listPrice) * 100);
  return discount > 0 ? `省 ${discount}%` : '优惠价';
}

function taskCopy(task) {
  const stats = partnerStats(task);
  if (task.type === 'random') return { title: '正在推荐', detail: `${stats.total ? `全站 + ${stats.total} 位语伴 · ` : ''}已展示 ${task.shown} / ${task.total} 人` };
  return { title: '指定语伴投放中', detail: `${stats.total} 位语伴 · 剩余 ${task.remaining} 小时` };
}

const friendOptions = [
  { name: 'Mia', initial: 'M', className: 'mia', active: false, note: '超过 3 天未登录' },
  { name: 'Noah', initial: 'N', className: 'noah', active: true, note: '刚刚在线' },
  { name: 'Ava', initial: 'A', className: '', active: true, note: '10 分钟前在线' },
  { name: 'Lina', initial: 'L', className: 'noah', active: true, note: '2 小时前在线' },
  { name: 'Eric', initial: 'E', className: '', active: true, note: '今天在线' },
  { name: 'Sora', initial: 'S', className: 'mia', active: true, note: '刚刚在线' },
  { name: 'June', initial: 'J', className: '', active: true, note: '30 分钟前在线' },
  { name: 'Kai', initial: 'K', className: 'noah', active: true, note: '1 小时前在线' },
  { name: 'Nina', initial: 'N', className: 'mia', active: true, note: '今天在线' },
  { name: 'Owen', initial: 'O', className: '', active: true, note: '昨天在线' }
];

function designatedPrice() {
  const product = selectedProduct('designated');
  return product ? product.price * state.selectedFriends.length : 0;
}

function designatedListPrice() {
  const product = selectedProduct('designated');
  return product ? product.listPrice * state.selectedFriends.length : 0;
}

function selectedFriendSummary() {
  if (!state.selectedFriends.length) return '选择指定语伴（可选）';
  if (state.selectedFriends.length === 1) return `已选择 ${state.selectedFriends[0].name}`;
  return `已选择 ${state.selectedFriends.length} 位语伴`;
}

function partnersOf(item) {
  if (Array.isArray(item?.partners)) return item.partners;
  if (!item?.name) return [];
  return [{ name: item.name, initial: item.initial || item.name[0], className: item.className || (item.name === 'Mia' ? 'mia' : 'noah'), status: item.status || '等待打开 App', remaining: item.remaining }];
}

function partnerStats(item) {
  const partners = partnersOf(item);
  const shown = partners.filter(partner => partner.status === '已展示').length;
  const pending = partners.filter(partner => partner.status === '等待打开 App' || partner.status === '投放中').length;
  const unshown = partners.filter(partner => partner.status === '未展示').length;
  return { partners, total: partners.length, shown, pending, unshown };
}

function partnerStack(partners, limit = 3) {
  if (!partners.length) return '';
  const visible = partners.slice(0, limit);
  return `<span class="partner-avatar-stack">${visible.map(partner => `<i class="avatar ${partner.className || ''}">${partner.initial || partner.name?.[0] || 'M'}</i>`).join('')}${partners.length > limit ? `<b>+${partners.length - limit}</b>` : ''}</span>`;
}

function partnerSummary(item, source, index, phase = 'ended') {
  const stats = partnerStats(item);
  if (!stats.total) return '';
  const result = phase === 'active'
    ? (stats.shown ? `已展示 ${stats.shown} 位${stats.pending ? ` · 等待 ${stats.pending} 位` : ''}` : `正在等待 ${stats.pending || stats.total} 位打开 App`)
    : `已展示 ${stats.shown} 位${stats.unshown ? ` · 未展示 ${stats.unshown} 位` : ''}`;
  return `<button class="partner-result-summary" data-action="open-partner-status" data-partner-source="${source}" data-partner-index="${index}" data-partner-phase="${phase}">${partnerStack(stats.partners)}<span><small>${source === 'task' && item.type === 'random' ? '同时指定语伴' : '指定语伴'}</small><strong>${stats.total} 位 · ${result}</strong></span><i class="chevron">›</i></button>`;
}

function renderMain() {
  const latest = state.activeTasks[0];
  const banner = latest ? (() => {
    const copy = taskCopy(latest);
    const progress = latest.type === 'random' ? `<i class="task-progress" aria-hidden="true"><b style="width:${Math.min(100, Math.round(latest.shown / latest.total * 100))}%"></b></i>` : '';
    return `<div class="task-banner" data-rule-target="banner">
      ${anchor('banner', '2')}<button class="task-banner-main" aria-label="查看进行中投放详情" data-action="open-active-task"><i class="banner-dot"></i><span class="banner-text"><strong>${copy.title}</strong><span>${copy.detail}</span>${progress}</span></button><button class="task-preview" aria-label="预览开屏效果" data-action="open-latest-preview">预览</button>
    </div>`;
  })() : '';
  const hero = '<section class="open-cover-banner" aria-label="开屏推荐介绍"><div class="banner-portrait" aria-hidden="true"><b><i></i>HelloTalk</b><span class="banner-portrait-photo"></span><em><i>✦</i> 今日开屏人物</em></div><div class="open-cover-copy"><span>开屏推荐</span><strong>让新朋友<br>第一眼看见你</strong><p>打开 App，就有机会遇见你</p><i class="banner-benefit">专属开屏封面</i></div></section>';
  const ready = state.photoSelected && state.templateSelected;
  const randomProducts = visibleProducts('random');
  const randomProduct = selectedProduct('random');
  const designatedProduct = selectedProduct('designated');
  const isDesignatedOnly = state.mode === 'designated';
  const hasDesignated = state.selectedFriends.length > 0;
  const randomPrice = randomProduct?.price || 0;
  const randomListPrice = randomProduct?.listPrice || 0;
  const currentPrice = isDesignatedOnly ? designatedPrice() : randomPrice + designatedPrice();
  const currentListPrice = isDesignatedOnly ? designatedListPrice() : randomListPrice + designatedListPrice();
  const canSubmit = ready && (isDesignatedOnly ? hasDesignated && !!designatedProduct : !!randomProduct) && state.agreed;
  const showCtaPrice = ready && (isDesignatedOnly ? hasDesignated && !!designatedProduct : !!randomProduct);
  const buttonText = !state.photoSelected ? '选择照片' : !state.templateSelected ? '选择风格' : '选择投放对象';
  const purchaseContent = showCtaPrice ? `<em class="vip-price-tag">优惠价</em><span class="cta-price"><span class="cta-current"><i class="currency-mark">HT</i><b>${currentPrice} 币</b></span><del>${currentListPrice} 币</del></span>` : buttonText;
  const purchaseLabel = !isDesignatedOnly
    ? `<span>选择推荐人数</span><button class="purchase-help" data-action="mode-help" data-help="package-duration" aria-label="查看推荐时长说明"></button>${state.modeHelp === 'package-duration' ? '<span class="purchase-tip" role="tooltip">每500次最多推荐48小时，可重复叠加，到达时间后即自动结束推荐。</span>' : ''}`
    : `<span>选择投放对象</span><button class="purchase-help" data-action="mode-help" data-help="duration" aria-label="查看推荐时长说明"></button>${state.modeHelp === 'duration' ? '<span class="purchase-tip" role="tooltip">最多曝光48小时，到达时候后即自动结束推荐</span>' : ''}`;
  const packageHtml = !isDesignatedOnly
    ? `<div class="package-grid package-count-${Math.max(1, randomProducts.length)}" data-rule-target="packages">${anchor('packages', '5')}${randomProducts.length ? randomProducts.map(product => `<button class="package ${state.selectedProductIds.random === product.id ? 'is-selected' : ''}" data-action="package" data-product-id="${product.id}">${product.recommendCount}<small>${savingText(product)}</small></button>`).join('') : '<p class="package-empty">暂无可投放的随机推荐商品</p>'}</div>`
    : '';
  const designatedSummary = hasDesignated
    ? `<span class="partner-avatar-stack" aria-label="已选择 ${state.selectedFriends.length} 位语伴">${state.selectedFriends.slice(0, 3).map(friend => `<i class="avatar ${friend.className}">${friend.initial}</i>`).join('')}${state.selectedFriends.length > 3 ? `<i class="partner-avatar-more">+${state.selectedFriends.length - 3}</i>` : ''}</span>`
    : '';
  const designatedMeta = hasDesignated ? `已选 ${state.selectedFriends.length} 位` : `${designatedProduct?.price || 0} 币/人`;
  const designatedLead = label => hasDesignated
    ? designatedSummary
    : `<span class="select-partner-icon" aria-hidden="true"><i>+</i></span><span class="partner-addon-copy"><strong>${label}</strong></span>`;

  return `${statusBar()}<section class="screen main-screen">
    <header class="boost-head"><button class="boost-close" data-action="close" aria-label="关闭">×</button><h2>加热中心</h2></header>
    <nav class="top-tabs" data-rule-target="tabs">${anchor('tabs', '1')}<button>帖子加热</button><button>超级曝光</button><button>聊天置顶</button><button class="is-active">开屏推荐</button></nav>
    <main class="main-content">
      ${banner}
      ${hero}
      <section class="section"><div class="card material-card" data-rule-target="cover">${anchor('cover', '3')}<button class="material-row" data-action="photo-sheet"><i class="setting-thumb ${state.photoSelected ? (state.photoSource === 'avatar' ? 'photo is-avatar' : 'photo is-photo') : ''}"></i><span><small>照片</small><strong>${state.photoSelected ? (state.photoSource === 'avatar' ? '头像' : '照片') : '选择照片'}</strong></span><i class="chevron">›</i></button><button class="material-row" data-action="open-template"><i class="template-thumb style-${state.template}"></i><span><small>风格</small><strong>${styleNames[state.template]}</strong></span><i class="chevron">›</i></button></div></section>
      <section class="section"><div class="card delivery-card compact-delivery"><div class="card-title-line"><h3 class="setting-card-title">投放给谁</h3><button class="history-link compact-history" data-action="open-records" aria-label="查看投放记录">◷</button></div><div class="mode-grid primary-mode-grid compact-mode-grid"><div class="mode-option random-mode-option"><button class="mode-card compact-mode ${!isDesignatedOnly ? 'is-selected' : ''}" data-action="mode" data-mode="random"><svg class="compact-mode-icon mode-symbol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M4 12h16M12 4c2.2 2.1 3.3 4.8 3.3 8S14.2 17.9 12 20c-2.2-2.1-3.3-4.8-3.3-8S9.8 6.1 12 4Z"></path></svg><strong>全站推荐<i class="mode-inline-help" data-action="mode-help" data-help="audience-default" aria-label="查看全站推荐说明">?</i></strong></button>${state.modeHelp === 'audience-default' ? '<div class="mode-tip" role="tooltip">优先推荐给语言互相匹配的人群</div>' : ''}</div><div class="mode-option"><button class="mode-card compact-mode ${isDesignatedOnly ? 'is-selected' : ''}" data-action="mode" data-mode="designated" data-rule-target="designated">${anchor('designated', '4')}<svg class="compact-mode-icon mode-symbol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"></circle><path d="M3.5 19c.8-3.2 2.7-4.8 5.5-4.8s4.7 1.6 5.5 4.8"></path><path d="M16 5h3v3M19 16v3h-3"></path></svg><strong>仅指定语伴<i class="mode-inline-help" data-action="mode-help" data-help="designated" aria-label="查看指定语伴说明">?</i></strong></button>${state.modeHelp === 'designated' ? '<div class="mode-tip mode-tip-right" role="tooltip">选择与你互相关注的语伴，可一次选择最多 10 位</div>' : ''}</div></div>${!isDesignatedOnly ? `<div class="audience-setting minimal-audience"><strong>匹配人群</strong><div class="audience-switch"><button class="${state.audience === 'default' ? 'is-selected' : ''}" data-action="audience" data-audience="default">默认</button><button class="${state.audience === 'custom' ? 'is-selected' : ''}" data-action="audience" data-audience="custom">自定义</button></div></div><button class="partner-addon minimal-partner" ${designatedProduct ? 'data-action="open-friends"' : 'disabled'}>${designatedLead('同时指定语伴')}<em class="${hasDesignated ? 'is-selected-count' : ''}">${designatedMeta}</em><i class="chevron">›</i></button>` : `<button class="partner-addon designated-only minimal-partner" ${designatedProduct ? 'data-action="open-friends"' : 'disabled'}>${designatedLead('选择指定语伴')}<em class="${hasDesignated ? 'is-selected-count' : ''}">${designatedMeta}</em><i class="chevron">›</i></button>`}</div></section>
    </main>
    <footer class="purchase-bar"><p class="purchase-label">${purchaseLabel}</p>${packageHtml}<button class="agreement" data-action="agreement"><i class="check ${state.agreed ? 'is-checked' : ''}">${state.agreed ? '✓' : ''}</i>我已阅读并同意<a>《开屏推荐协议》</a></button><button class="primary ${showCtaPrice ? 'has-price' : ''}" ${canSubmit ? '' : 'disabled'} data-action="submit" data-rule-target="purchase">${anchor('purchase', '6')}${purchaseContent}</button></footer>
  </section>`;
}

function renderTemplateSheet() {
  const copies = ['嘿，很高兴见到你！人生总要有几次主动，何不从现在开始？', '愿你今天的心情，也和这次相遇一样明亮。', '第一眼很短，认识你可以很长。'];
  return `<div class="overlay template-overlay"><section class="template-sheet${state.overlayEntered ? '' : ' is-entering'}" role="dialog" aria-modal="true" aria-labelledby="template-sheet-title"><i class="sheet-handle"></i><header class="template-sheet-head"><h2 id="template-sheet-title">选择风格</h2><button data-action="overlay-close" aria-label="关闭">×</button></header><main class="template-sheet-content">
    <section class="template-preview" data-rule-target="template">${anchor('template', '4')}<span class="splash-preview-label">开屏界面预览</span><div class="splash-art-preview"><section class="mini-splash-screen"><div class="mini-splash-brand"><i></i>HelloTalk</div><i class="selected-photo style-${state.template}"></i><div class="mini-splash-copy"><strong>Hi，很高兴认识你</strong><span>${copies[state.copy]}</span></div><i class="mini-splash-action">打个招呼</i></section></div><div class="template-copy-line"><span>${copies[state.copy]}</span><button data-action="refresh-copy" aria-label="换一句开屏文案">↻</button></div></section>
    <section class="section style-section"><div class="style-heading"><p class="style-name">${styleNames[state.template]}</p></div><div class="template-rail">${styleNames.map((name, index) => `<button class="template style-${index} ${state.template === index ? 'is-selected' : ''}" data-action="template" data-template="${index}" aria-label="${name}"><i class="template-visual"></i></button>`).join('')}</div></section>
  </main><footer class="template-sheet-footer"><button class="primary" data-action="cover-done">完成</button></footer></section></div>`;
}

function renderFriends() {
  const draft = state.friendDraft;
  const selected = new Set(draft.map(friend => friend.name));
  const unitPrice = selectedProduct('designated')?.price || 0;
  const totalPrice = unitPrice * draft.length;
  return `${statusBar()}<section class="screen subpage"><header class="page-head">${backButton()}<h2>选择指定语伴</h2><span class="head-icon"></span></header><main class="sub-content friend-page-content"><p class="friend-page-tip">选择最多 10 位互关语伴；每位语伴独立展示 1 次。</p><input class="friend-search" placeholder="搜索互关语伴" aria-label="搜索互关语伴" /><div class="friend-list">${friendOptions.map(friend => `<button class="friend ${selected.has(friend.name) ? 'is-selected' : ''}" data-action="friend" data-name="${friend.name}" data-initial="${friend.initial}" data-class="${friend.className}" data-active="${friend.active}"><span class="avatar ${friend.className}">${friend.initial}</span><span class="friend-info"><strong>${friend.name}</strong><span>${friend.note}</span></span><i class="${friend.active ? 'online' : 'offline'}"></i><i class="friend-check">${selected.has(friend.name) ? '✓' : ''}</i></button>`).join('')}</div></main><footer class="friend-select-footer"><div class="friend-selection-summary"><span>已选择 <b>${draft.length}</b> / 10 位</span><em>${totalPrice} 币</em></div><button class="primary" data-action="friend-confirm" aria-label="确认选择，本次共 ${totalPrice} 币">确认选择</button></footer></section>`;
}

function renderCustomAudienceSheet() {
  const option = (label, value) => `<button class="custom-filter-row" data-action="custom-filter"><span><small>${label}</small><strong>${value}</strong></span><i class="chevron">›</i></button>`;
  return `<div class="overlay custom-overlay"><section class="custom-audience-sheet${state.overlayEntered ? '' : ' is-entering'}" role="dialog" aria-modal="true" aria-labelledby="custom-audience-title"><i class="sheet-handle"></i><header class="custom-audience-head"><button data-action="overlay-close" aria-label="关闭">×</button><div><h2 id="custom-audience-title">自定义</h2><p>优先满足条件，算法智能拓展相似人群</p></div><span></span></header><main class="custom-audience-content">${option('母语', '任何')}${option('学习语言', '任何')}${option('国籍 / 地区', '任何')}${option('城市 / 州 / 国家', '任何')}<section class="custom-gender"><div><strong>性别</strong><em>${state.customGender}</em></div><div class="custom-gender-options">${['全部', '女', '男'].map(value => `<button class="${state.customGender === value ? 'is-selected' : ''}" data-action="custom-gender" data-gender="${value}">${value}</button>`).join('')}</div></section><section class="custom-age"><div><strong>年龄</strong><em>18-90+</em></div><div class="age-range"><i></i><b></b><b></b></div><span><small>18</small><small>90+</small></span></section></main><footer class="custom-audience-footer"><button class="custom-reset" data-action="custom-reset">重置</button><button class="primary" data-action="custom-confirm">确认</button></footer></section></div>`;
}

function renderSplashPreview() {
  const task = state.previewItem || state.activeTasks[0] || { photoSource: state.photoSource, style: state.template, copy: state.copy };
  const copies = ['很高兴认识你，愿这次相遇让今天更明亮。', '愿你今天的心情，也和这次相遇一样明亮。', '第一眼很短，认识你可以很长。'];
  const imageClass = task.photoSource === 'avatar' ? 'is-avatar' : `is-album style-${task.style}`;
  const saveAction = '<button class="preview-save-card" data-action="save-preview-image"><i class="preview-save-icon">↓</i><span>保存图片</span></button>';
  const detailAction = state.previewOrigin === 'history'
    ? '<button class="preview-detail-link" data-action="open-placement-detail">查看投放详情 <i>›</i></button>'
    : '';
  return `${statusBar()}<section class="screen splash-preview-page"><header class="page-head"><button class="head-icon" data-action="preview-back" aria-label="返回">‹</button><h2>预览开屏效果</h2><span class="head-icon"></span></header><main class="splash-preview-content"><p>这是其他用户打开 HelloTalk 时看到的效果</p><section class="recipient-splash" aria-label="开屏效果预览"><div class="recipient-status"><span>15:07</span><span>◒ ◒ ▭</span></div><div class="recipient-brand"><i></i>HelloTalk</div><i class="recipient-cover ${imageClass}"></i><div class="recipient-copy"><strong>Hi，很高兴认识你</strong><span>${copies[task.copy || 0]}</span></div><button class="recipient-action">打个招呼</button></section>${saveAction}${detailAction}${state.previewSaved ? '<p class="preview-save-result" role="status">图片已保存</p>' : ''}<p class="splash-preview-note">开屏文案将按对方的界面语言展示</p></main></section>`;
}

function renderPlacementDetail() {
  const record = state.placementDetail;
  if (!record) return renderMain();
  const imageClass = record.photoSource === 'album' ? `is-album style-${record.style}` : 'is-avatar';
  const isRandom = record.type === 'random';
  const partners = partnerStats(record);
  const metrics = isRandom
    ? `<div class="placement-detail-metrics"><span><small>已展示人数</small><strong>${record.shown || 0}<i> 人</i></strong></span><span><small>访客数</small><strong>${record.visitors || 0}<i> 人</i></strong></span></div>`
    : `<div class="placement-detail-metrics"><span><small>指定人数</small><strong>${partners.total}<i> 位</i></strong></span><span><small>已展示</small><strong class="is-success">${partners.shown}<i> 位</i></strong></span></div>`;
  return `${statusBar()}<section class="screen subpage"><header class="page-head"><button class="head-icon" data-action="placement-detail-back" aria-label="返回">‹</button><h2>投放详情</h2><span class="head-icon"></span></header><main class="sub-content placement-detail-page"><article class="placement-detail-card"><header><span>${isRandom ? '全站推荐' : '仅指定语伴'}</span><em>${record.status}</em></header><button class="placement-detail-cover" data-action="open-detail-preview"><i class="history-cover-preview ${imageClass}"></i><span><small>开屏封面</small><strong>${record.photoSource === 'album' ? '照片' : '头像'} · ${styleNames[record.style] || styleNames[0]}</strong></span><i class="chevron">›</i></button>${metrics}${partnerSummary(record, 'detail', 0, 'ended')}</article></main></section>`;
}

function renderPartnerInfo() {
  const partner = state.partnerInfo;
  if (!partner) return renderMain();
  const online = partner.active !== false;
  return `${statusBar()}<section class="screen subpage"><header class="page-head"><button class="head-icon" data-action="partner-info-back" aria-label="返回">‹</button><h2>语伴信息</h2><span class="head-icon"></span></header><main class="sub-content partner-info-page"><article class="partner-info-card"><span class="avatar ${partner.className || 'mia'}">${partner.initial || partner.name?.[0] || 'M'}</span><div><strong>${partner.name || '—'}</strong><small>互相关注语伴</small><em class="${online ? 'is-online' : 'is-offline'}">${online ? '当前在线' : '超过 3 天未登录'}</em></div></article><p>该语伴将在打开 App 时看到你的开屏封面。</p></main></section>`;
}

function renderRecords() {
  return `${statusBar()}<section class="screen subpage"><header class="page-head">${backButton()}<h2>投放记录</h2><span class="head-icon"></span></header><main><section class="section"><div class="record-list" data-rule-target="records">${anchor('records', '7')}<span style="position:absolute;right:8px;top:39px">${anchor('records', '8')}</span>${state.records.map(record => `<div class="task-row"><i class="${record.type === 'designated' ? `avatar ${record.name === 'Mia' ? 'mia' : 'noah'}` : 'task-thumb'}">${record.type === 'designated' ? record.name[0] : ''}</i><span class="task-info"><strong>${record.title}</strong><span>${record.detail}</span></span><em class="status-pill">${record.status}</em></div>`).join('')}</div></section></main></section>`;
}

function renderHistorySheet() {
  const coverConfig = (record, index) => `<button class="history-cover-config" data-action="open-preview" data-preview-source="record" data-preview-index="${index}"><i class="history-cover-preview ${record.photoSource === 'album' ? `is-album style-${record.style}` : 'is-avatar'}"></i><span><small>开屏封面</small><strong>${record.photoSource === 'album' ? '照片' : '头像'} · ${styleNames[record.style]}</strong></span><i class="chevron">›</i></button>`;
  const recordCard = (record, index) => record.type === 'random'
    ? `<article class="history-card history-random" role="group"><header><time>${record.date}</time><span class="history-mode">全站推荐</span><em>${record.status}</em></header>${coverConfig(record, index)}<div class="history-metrics"><button class="history-audience-metric" data-action="open-audience" data-audience-tab="shown" data-audience-source="record" data-audience-index="${index}" aria-label="查看 ${record.shown} 位已展示用户"><span>已展示人数 <i>›</i></span><strong>${record.shown}</strong><small>人</small></button><button class="history-audience-metric" data-action="open-audience" data-audience-tab="visitors" data-audience-source="record" data-audience-index="${index}" aria-label="查看 ${record.visitors} 位看过封面的用户"><span>访客数 <i>›</i></span><strong>${record.visitors}</strong><small>人</small></button></div>${partnerSummary(record, 'record', index, 'ended')}<footer><button class="history-copy" data-action="copy-record">复制本次条件</button><button class="history-repeat" data-action="repeat-random" data-record-index="${index}">再次推荐</button></footer></article>`
    : `<article class="history-card history-designated" role="group"><header><time>${record.date}</time><span class="history-mode">仅指定语伴</span><em class="${partnerStats(record).shown ? 'is-success' : 'is-muted'}">${record.status}</em></header>${coverConfig(record, index)}${partnerSummary(record, 'record', index, 'ended')}<footer><button class="history-copy" data-action="copy-record">复制本次条件</button><button class="history-repeat" data-action="repeat-designated" data-record-index="${index}">再次推荐</button></footer></article>`;
  return `<div class="overlay history-overlay"><section class="history-sheet${state.overlayEntered ? '' : ' is-entering'}" role="dialog" aria-modal="true" aria-labelledby="history-sheet-title"><i class="sheet-handle"></i><header class="history-sheet-head"><button data-action="overlay-close" aria-label="关闭">×</button><h2 id="history-sheet-title">投放记录</h2><span></span></header><main class="history-list" data-rule-target="records">${anchor('records', '7')}${anchor('records', '8')}${state.records.map(recordCard).join('')}</main></section></div>`;
}

function renderActiveTasksSheet() {
  const taskCard = (task, index) => {
    const copy = taskCopy(task);
    const imageClass = task.photoSource === 'album' ? `is-album style-${task.style}` : 'is-avatar';
    if (task.type !== 'random') return `<article class="active-task-card active-designated-card"><button class="active-task-preview" data-action="open-preview" data-preview-source="task" data-preview-index="${index}" aria-label="预览开屏效果"><i class="history-cover-preview ${imageClass}"></i><span><strong>仅指定语伴</strong><small>${copy.detail}</small></span><em>预览</em><i class="chevron">›</i></button>${partnerSummary(task, 'task', index, 'active')}</article>`;
    return `<article class="active-task-card active-random-card"><button class="active-task-preview" data-action="open-preview" data-preview-source="task" data-preview-index="${index}" aria-label="预览全站推荐开屏效果"><i class="history-cover-preview ${imageClass}"></i><span><strong>全站推荐</strong><small>正在向匹配的新朋友推荐</small></span><em>${copy.title}</em><i class="chevron">›</i></button><div class="active-live-metrics"><button data-action="open-audience" data-audience-tab="shown" data-audience-source="task" data-audience-index="${index}" aria-label="查看 ${task.shown} 位已展示用户"><small>已展示人数 <i>›</i></small><strong>${task.shown}<i> / ${task.total} 人</i></strong></button><button data-action="open-audience" data-audience-tab="visitors" data-audience-source="task" data-audience-index="${index}" aria-label="查看 ${task.visitors} 位看过封面的用户"><small>访客数 <i>›</i></small><strong>${task.visitors}<i> 人</i></strong></button></div>${partnerSummary(task, 'task', index, 'active')}</article>`;
  };
  return `<div class="overlay history-overlay"><section class="active-tasks-sheet${state.overlayEntered ? '' : ' is-entering'}" role="dialog" aria-modal="true" aria-labelledby="active-tasks-title"><i class="sheet-handle"></i><header class="history-sheet-head"><button data-action="overlay-close" aria-label="关闭">×</button><h2 id="active-tasks-title">投放详情</h2><span></span></header><main class="active-tasks-list"><p>${state.activeTasks.length > 1 ? `进行中（${state.activeTasks.length}）` : '进行中'}</p>${state.activeTasks.map(taskCard).join('')}</main></section></div>`;
}

function renderAudienceSheet() {
  const task = state.audienceTask || {};
  const isShown = state.audienceTab === 'shown';
  const shownUsers = [
    ['Mia', '♀ 24', 'CN ⇄ JP', '台北市，中国', 'style-3'],
    ['Luna', '♀ 23', 'CN ⇄ EN', '上海市，中国', 'style-0'],
    ['Alex', '♂ 26', 'EN ⇄ CN', '新加坡', 'style-2'],
    ['Yuki', '♀ 22', 'JP ⇄ CN', '东京，日本', 'style-1'],
    ['Noah', '♂ 25', 'CN ⇄ KR', '首尔，韩国', 'style-0'],
    ['Sofia', '♀ 24', 'ES ⇄ EN', '马德里，西班牙', 'style-3']
  ];
  const visitors = [
    ['Rinn', '♀ 24', 'CN ⇄ JP', '台北市，中国', 'style-0'],
    ['欧尼', '♀ 23', 'CN ⇄ JP', '上海市，中国', 'style-1'],
    ['Luther', '♂ 23', 'CN ⇄ JP', '中野区，日本', 'style-2'],
    ['Ava', '♀ 25', 'EN ⇄ CN', '温哥华，加拿大', 'style-3'],
    ['Richie', '♂ 27', 'CN ⇄ JP', '广州市，中国', 'style-0'],
    ['Mika', '♀ 22', 'JP ⇄ CN', '大阪府，日本', 'style-1']
  ];
  const count = isShown ? (task.shown || 0) : (task.visitors || 0);
  const people = (isShown ? shownUsers : visitors).slice(0, Math.min(count, 6));
  const summary = isShown
    ? `已向 <strong>${count}</strong> 位用户展示你的开屏封面`
    : `已有 <strong>${count}</strong> 位用户看过你的开屏封面`;
  return `<div class="overlay history-overlay"><section class="audience-sheet${state.overlayEntered ? '' : ' is-entering'}" role="dialog" aria-modal="true" aria-labelledby="audience-sheet-title"><i class="sheet-handle"></i><header class="history-sheet-head"><button data-action="audience-close" aria-label="关闭">×</button><h2 id="audience-sheet-title">投放数据</h2><span></span></header><nav class="audience-tabs" role="tablist"><button class="${isShown ? 'is-active' : ''}" data-action="audience-tab" data-audience-tab="shown" role="tab" aria-selected="${isShown}">已展示人数 <strong>${task.shown || 0}</strong></button><button class="${isShown ? '' : 'is-active'}" data-action="audience-tab" data-audience-tab="visitors" role="tab" aria-selected="${!isShown}">访客数 <strong>${task.visitors || 0}</strong></button></nav><main class="audience-list"><p>${summary}</p>${people.map(([name, meta, languages, city, style]) => `<article class="visitor-row"><i class="visitor-avatar ${style}"></i><span><strong>${name}<em>${meta}</em></strong><small>${languages}</small><small>${city}</small></span></article>`).join('')}</main></section></div>`;
}

function overlay() {
  if (!state.overlay) return '';
  const enterClass = state.overlayEntered ? '' : ' is-entering';
  if (state.overlay === 'template') return renderTemplateSheet();
  if (state.overlay === 'records') return renderHistorySheet();
  if (state.overlay === 'active-tasks') return renderActiveTasksSheet();
  if (state.overlay === 'audience') return renderAudienceSheet();
  if (state.overlay === 'partner-status') return renderPartnerStatusSheet();
  if (state.overlay === 'completion') return renderCompletionNotice();
  if (state.overlay === 'custom-audience') return renderCustomAudienceSheet();
  if (state.overlay === 'photo') return `<div class="overlay"><div class="sheet${enterClass}"><i class="sheet-handle"></i><h3>请选择照片</h3><button class="sheet-action" data-action="photo-select" data-source="avatar">使用头像</button><button class="sheet-action" data-action="photo-select" data-source="album">拍照/相册</button><button class="sheet-action sheet-cancel" data-action="overlay-close">取消</button></div></div>`;
  if (state.overlay === 'preview') return `<div class="overlay"><div class="dialog${enterClass}"><h3>商品模版预览</h3><div class="mini-cover" style="margin:14px 0 12px">第一眼很短，认识你可以很长。</div><p>实际开屏文案会按接收者的界面语言展示。</p><div class="dialog-actions"><button class="confirm" data-action="overlay-close">知道了</button></div></div></div>`;
  if (state.overlay === 'inactive') return `<div class="overlay"><div class="dialog${enterClass}"><h3>${state.pendingFriend?.name || '这位语伴'} 已超过 3 天未登录</h3><p>${state.pendingFriend?.name || '对方'} 下次打开 App 时将看到你的开屏封面。48 小时内未打开，推荐自动结束。</p><div class="dialog-actions"><button class="secondary" data-action="overlay-close">换一位语伴</button><button class="confirm" data-action="confirm-inactive">仍然选择</button></div></div></div>`;
  if (state.overlay === 'created') return `<div class="overlay"><div class="dialog${enterClass}"><h3>已开始生成开屏封面</h3><p>完成后将自动开始推荐，你可在开屏推荐顶部查看状态。</p><div class="dialog-actions"><button class="confirm" data-action="overlay-close">知道了</button></div></div></div>`;
  return '';
}

function renderPartnerStatusSheet() {
  const items = state.partnerStatusItems || [];
  return `<div class="overlay history-overlay"><section class="partner-status-sheet${state.overlayEntered ? '' : ' is-entering'}" role="dialog" aria-modal="true" aria-labelledby="partner-status-title"><i class="sheet-handle"></i><header class="history-sheet-head"><button data-action="partner-status-close" aria-label="关闭">×</button><h2 id="partner-status-title">指定语伴结果</h2><span></span></header><main class="partner-status-list"><p>每位语伴均独立展示 1 次</p>${items.map(partner => `<article><span class="avatar ${partner.className || ''}">${partner.initial || partner.name?.[0] || 'M'}</span><span><strong>${partner.name}</strong><small>${partner.status === '已展示' ? '已在打开 App 的第一眼看到你' : partner.status === '未展示' ? '本次结束前未打开 App' : `等待打开 App · 剩余 ${partner.remaining ?? 42} 小时`}</small></span><em class="${partner.status === '已展示' ? 'is-success' : partner.status === '未展示' ? 'is-muted' : ''}">${partner.status || '等待打开 App'}</em></article>`).join('')}</main></section></div>`;
}

function renderCompletionNotice() {
  const notice = state.completionNotice;
  if (!notice) return '';
  const isRandom = notice.type === 'random';
  const partners = partnerStats(notice);
  const total = notice.total || selectedProduct('random')?.recommendCount || notice.shown || 0;
  const isComplete = notice.status === '投放完成' || notice.shown >= total;
  const duration = notice.duration || '06:00:00';
  const result = isRandom
    ? `<strong>${isComplete ? '这次亮相，让更多新朋友第一眼看到你' : '这次亮相先到这里，下次继续让更多新朋友看见你'}</strong>`
    : `<strong>${partners.shown ? `这次亮相，已被 ${partners.shown} 位语伴第一眼看见` : '这次亮相先到这里，下一次再创造相遇'}</strong>`;
  const metrics = isRandom
    ? `<div class="completion-metric"><span>展示人数</span><strong>${notice.shown}<small>${isComplete ? ' 人' : ` / ${total} 人`}</small></strong></div><div class="completion-metric"><span>投放时长</span><strong>${duration}</strong></div><div class="completion-metric"><span>访客数</span><strong>${notice.visitors}<small>人</small></strong></div>`
    : `<div class="completion-metric"><span>指定人数</span><strong>${partners.total}<small> 位</small></strong></div><div class="completion-metric"><span>已展示</span><strong>${partners.shown}<small> 位</small></strong></div><div class="completion-metric"><span>投放时长</span><strong>${duration}</strong></div>`;
  const repeatData = isRandom
    ? 'data-action="completion-repeat" data-mode="random"'
    : 'data-action="completion-repeat" data-mode="designated"';
  const partnerResult = partners.total ? partnerSummary(notice, 'completion', 0, 'ended') : '';
  return `<div class="overlay completion-overlay"><section class="completion-sheet${state.overlayEntered ? '' : ' is-entering'}" role="dialog" aria-modal="true" aria-labelledby="completion-title"><i class="sheet-handle"></i><header class="completion-sheet-head"><button data-action="completion-close" aria-label="关闭">×</button><h2 id="completion-title">开屏推荐已结束</h2><span aria-hidden="true"></span></header><main class="completion-sheet-body"><article class="completion-result-card"><div class="completion-result-copy">${result}</div><div class="completion-type"><em>${isRandom ? '全站推荐' : '仅指定语伴'}</em></div><img class="completion-splash-ip" src="assets/completion-ip.png" alt="" aria-hidden="true"><div class="completion-result-metrics">${metrics}</div>${partnerResult}</article></main><footer class="completion-sheet-footer"><button class="completion-repeat" ${repeatData}>再次推荐</button></footer></section></div>`;
}

function downloadPreviewImage(task) {
  const canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = 1240;
  const context = canvas.getContext('2d');
  if (!context) return;
  const copies = ['很高兴认识你，愿这次相遇让今天更明亮。', '愿你今天的心情，也和这次相遇一样明亮。', '第一眼很短，认识你可以很长。'];
  const radius = (x, y, width, height, value) => {
    context.beginPath();
    context.roundRect(x, y, width, height, value);
    context.closePath();
  };
  const paint = (image) => {
    const gradient = context.createLinearGradient(0, 0, 750, 1240);
    gradient.addColorStop(0, '#2d3264');
    gradient.addColorStop(.55, '#56476f');
    gradient.addColorStop(1, '#202950');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 750, 1240);
    const glow = context.createRadialGradient(620, 170, 5, 620, 170, 360);
    glow.addColorStop(0, 'rgba(255,196,128,.46)');
    glow.addColorStop(1, 'rgba(255,196,128,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, 750, 1240);
    context.fillStyle = '#fff';
    context.font = '700 34px -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif';
    context.fillText('HelloTalk', 68, 105);
    radius(54, 160, 642, 594, 34);
    context.save();
    context.clip();
    if (task.photoSource === 'album' && image) {
      const halfWidth = image.width / 2;
      const halfHeight = image.height / 2;
      const sourceX = task.style % 2 ? halfWidth : 0;
      const sourceY = task.style > 1 ? halfHeight : 0;
      context.drawImage(image, sourceX, sourceY, halfWidth, halfHeight, 54, 160, 642, 594);
    } else if (image) {
      context.drawImage(image, 0, 0, image.width, image.height, 54, 160, 642, 594);
    }
    context.restore();
    context.fillStyle = '#fff';
    context.font = '700 46px -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif';
    context.fillText('Hi，很高兴认识你', 54, 846);
    context.fillStyle = 'rgba(255,255,255,.86)';
    context.font = '32px -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif';
    const text = copies[task.copy || 0];
    context.fillText(text.slice(0, 18), 54, 904);
    if (text.length > 18) context.fillText(text.slice(18), 54, 946);
    radius(54, 1040, 642, 96, 26);
    context.fillStyle = '#fff';
    context.fill();
    context.fillStyle = '#30345d';
    context.font = '700 32px -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif';
    context.textAlign = 'center';
    context.fillText('打个招呼', 375, 1100);
    const anchor = document.createElement('a');
    anchor.download = 'HelloTalk-开屏推荐.png';
    anchor.href = canvas.toDataURL('image/png');
    anchor.click();
  };
  const image = new Image();
  image.onload = () => paint(image);
  image.onerror = () => paint(null);
  image.src = task.photoSource === 'album' ? 'assets/style-cases.png' : 'assets/user-avatar.png';
}

function typeLabel(type) { return type === 'random' ? '随机推荐' : '指定语伴'; }

function productRows(type) {
  return productCatalog[type].map(product => `<tr>
    <td>${product.id}</td><td><strong>${product.name}</strong></td><td>${typeLabel(type)}</td><td>${type === 'random' ? `${product.recommendCount} 次` : '1 位'}</td>
    <td>${product.price} 币</td><td>${product.listPrice} 币</td>
    <td><label class="admin-switch"><input type="checkbox" data-backend-action="enabled" data-product-id="${product.id}" ${product.enabled ? 'checked' : ''}/><i></i><span>${product.enabled ? '启用' : '停用'}</span></label></td>
    <td><button class="table-link" data-backend-action="edit-product" data-product-id="${product.id}">编辑</button></td>
  </tr>`).join('');
}

function productDialogValues(root = backendConsole) {
  const value = (id) => root?.querySelector(`#${id}`)?.value.trim() || '';
  const prices = ['adminProductDisplayPrice', 'adminProductFirstPrice', 'adminProductActualPrice', 'adminProductVipPrice'];
  const values = Object.fromEntries(prices.map(id => [id, value(id)]));
  const exposure = value('adminProductExposureCount');
  const dialogType = state.adminDialogType || state.backendType;
  const positive = (input) => input !== '' && Number.isFinite(Number(input)) && Number(input) > 0;
  const exposureValid = dialogType === 'random'
    ? positive(exposure) && Number(exposure) >= 500 && Number(exposure) % 500 === 0
    : Number(exposure) === 1;
  return {
    name: value('adminProductName'),
    displayPrice: values.adminProductDisplayPrice,
    firstPrice: values.adminProductFirstPrice,
    actualPrice: values.adminProductActualPrice,
    vipPrice: values.adminProductVipPrice,
    exposure,
    isValid: Boolean(value('adminProductName')) && Object.values(values).every(positive) && exposureValid
  };
}

function syncProductDialogValidity() {
  const button = backendConsole?.querySelector('[data-backend-action="save-product"]');
  if (button) button.disabled = !productDialogValues().isValid;
}

function renderProductPage(type) {
  return `<div class="admin-page-head"><div><h2>商品配置</h2><p>配置开屏推荐商品与价格，保存后将同步给客户端。</p></div><button class="admin-primary" data-backend-action="new-product">＋ 新建商品</button></div>
    <section class="admin-filter"><label>商品类型<select data-backend-action="type"><option value="random" ${type === 'random' ? 'selected' : ''}>随机推荐</option><option value="designated" ${type === 'designated' ? 'selected' : ''}>指定语伴</option></select></label><label>商品状态<select><option>全部状态</option><option>启用</option><option>停用</option></select></label><button class="admin-search">查询</button><button class="admin-reset">重置</button></section>
    <section class="admin-card"><div class="admin-card-head"><strong>商品列表</strong><span>共 ${productCatalog[type].length} 个商品</span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>商品 ID</th><th>商品名称</th><th>投放类型</th><th>推荐人数</th><th>到手价</th><th>划线价</th><th>状态</th><th>操作</th></tr></thead><tbody>${productRows(type)}</tbody></table></div></section>`;
}

function renderPlacementPage(type) {
  const max = type === 'random' ? 4 : 1;
  const groups = productGroups[type];
  const defaultId = defaultGroupIds[type];
  const current = placementConfig[type];
  return `<div class="admin-page-head"><div><h2>商品分组</h2><p>一个商品组可包含多个商品，客户端按默认商品组外显。</p></div><div class="admin-page-actions"><span class="admin-count">${typeLabel(type)} · 已外显 ${visibleProducts(type).length} / ${max}</span><button class="admin-import" data-backend-action="open-import-dialog">剪贴板导入</button><button class="admin-primary" data-backend-action="new-placement">＋ 新增</button></div></div>
    <section class="admin-filter placement-filter"><label>ID<input placeholder="请输入 ID" /></label><label>商品名称<input placeholder="请输入商品名称" /></label><label>分组<select><option>请选择</option>${groups.map(group => `<option>${group.name}</option>`).join('')}</select></label><label>商品分类<select><option>请选择</option><option>开屏推荐</option><option>付费曝光</option></select></label><button class="admin-reset">重置</button><button class="admin-search">查询</button></section>
    <section class="admin-card"><div class="admin-card-head"><strong>商品组列表</strong><span>共 ${groups.length} 条数据</span></div><div class="admin-table-wrap"><table class="admin-table placement-table group-table"><thead><tr><th>商品组 ID</th><th>商品分类</th><th>商品组名称</th><th>商品组描述</th><th>所含商品</th><th>操作</th></tr></thead><tbody>${groups.map(group => {
      const names = group.productIds.map(id => productById(type, id)?.name).filter(Boolean).join('\n');
      const isDefault = group.id === defaultId;
      return `<tr><td>${group.id}</td><td>${group.category}</td><td><strong>${group.name}</strong></td><td>${group.description}</td><td><span class="group-product-list">${names || '—'}</span></td><td><button class="table-link" data-backend-action="edit-placement" data-group-id="${group.id}">编辑</button><button class="table-link" data-backend-action="copy-placement" data-group-id="${group.id}">复制</button><button class="table-link" data-backend-action="set-default-group" data-group-id="${group.id}" ${isDefault ? 'disabled' : ''}>${isDefault ? '已设为默认商品组' : '设为默认商品组'}</button></td></tr>`;
    }).join('')}</tbody></table></div></section>`;
}

function parsePlacementImport(text, type) {
  const [name = '', description = '', ids = ''] = text.split('|').map(item => item.trim());
  const max = type === 'random' ? 4 : 1;
  const requestedIds = [...new Set(ids.split(/[，,\s]+/).filter(Boolean))];
  const productIds = requestedIds.filter(id => productCatalog[type].some(product => product.id === id && product.enabled));
  const isValid = Boolean(name && description && productIds.length && productIds.length <= max && productIds.length === requestedIds.length);
  return { name, description, productIds, isValid };
}

function renderPlacementImportDialog() {
  if (!state.adminImportDialog) return '';
  const parsed = parsePlacementImport(state.adminImportText, state.backendType);
  return `<div class="admin-dialog-backdrop"><section class="admin-dialog admin-import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-dialog-title"><header><h3 id="import-dialog-title">剪贴板导入商品组</h3><button data-backend-action="close-import-dialog" aria-label="关闭">×</button></header><main><p>按“商品组名称 | 商品组描述 | 商品 ID，商品 ID”粘贴；随机推荐最多 4 个商品，指定语伴最多 1 个商品。</p><textarea id="adminImportText" placeholder="例如：随机推荐默认商品组 | 用于开屏推荐 | open-r-500, open-r-1000">${state.adminImportText}</textarea><small class="admin-import-status">${state.adminImportText && !parsed.isValid ? '请补全名称、描述和启用商品 ID；商品数量不可超过该投放类型上限。' : '导入后会新增一个商品组，不会替换当前默认商品组。'}</small></main><footer><button class="admin-cancel" data-backend-action="read-clipboard">读取剪贴板</button><button class="admin-cancel" data-backend-action="close-import-dialog">取消</button><button class="admin-primary" data-backend-action="save-import-group" ${parsed.isValid ? '' : 'disabled'}>确认</button></footer></section></div>`;
}

function renderPlacementDialog() {
  if (!state.adminPlacementDialog) return '';
  const type = state.backendType;
  const max = type === 'random' ? 4 : 1;
  const draftIds = state.adminPlacementDraftIds || [];
  const selected = new Set(draftIds);
  const dialog = state.adminPlacementDialog;
  const editingGroup = dialog.mode === 'edit' ? productGroups[type].find(group => group.id === dialog.groupId) : null;
  const draft = state.adminPlacementDraft || {};
  const groupName = draft.name ?? editingGroup?.name ?? '';
  const groupDescription = draft.description ?? editingGroup?.description ?? '';
  const groupCategory = draft.category || editingGroup?.category || '开屏推荐';
  const canSave = Boolean(groupName.trim() && groupDescription.trim() && selected.size);
  return `<div class="admin-dialog-backdrop"><section class="admin-dialog admin-placement-dialog" role="dialog" aria-modal="true" aria-labelledby="placement-dialog-title"><header><h3 id="placement-dialog-title">${dialog.mode === 'edit' ? '编辑商品组' : '添加商品组'}</h3><button data-backend-action="close-placement-dialog" aria-label="关闭">×</button></header><section class="placement-group-fields"><label><b>*</b>商品组名称<input id="adminGroupName" required value="${groupName}" placeholder="请输入商品组名称" /></label><label><b>*</b>商品组描述<input id="adminGroupDescription" required value="${groupDescription}" placeholder="请输入商品组描述" /></label><label>商品分类<select id="adminGroupCategory"><option ${groupCategory === '开屏推荐' ? 'selected' : ''}>开屏推荐</option><option ${groupCategory === '付费曝光' ? 'selected' : ''}>付费曝光</option></select></label></section><section class="placement-dialog-filter"><label>ID<input placeholder="请输入 ID" /></label><label>商品名称<input placeholder="请输入商品名称" /></label><label>状态<select><option>请选择</option><option>启用</option><option>关闭</option></select></label><label>曝光次数<input placeholder="请输入曝光次数" /></label><button class="admin-reset">重置</button><button class="admin-search">查询</button></section><main class="placement-dialog-body"><div class="placement-dialog-meta"><strong>选择商品</strong><span>已选择 ${selected.size} / ${max}</span></div><div class="admin-table-wrap"><table class="admin-table placement-pick-table"><thead><tr><th>选择</th><th>Product ID</th><th>商品名称</th><th>状态</th><th>投放类型</th><th>曝光次数</th></tr></thead><tbody>${productCatalog[type].map(product => `<tr><td><input type="checkbox" data-backend-action="placement-pick" data-product-id="${product.id}" ${selected.has(product.id) ? 'checked' : ''} ${!product.enabled || (!selected.has(product.id) && selected.size >= max) ? 'disabled' : ''} /></td><td>${product.id}</td><td>${product.name}</td><td><span class="record-status ${product.enabled ? '' : 'is-running'}">${product.enabled ? '启用' : '关闭'}</span></td><td>${typeLabel(type)}</td><td>${product.exposureCount || product.recommendCount} 次</td></tr>`).join('')}</tbody></table></div></main><footer><button class="admin-cancel" data-backend-action="close-placement-dialog">取消</button><button class="admin-primary" data-backend-action="save-placement-group" data-group-id="${dialog.groupId || ''}" ${canSave ? '' : 'disabled'}>确认</button></footer></section></div>`;
}

function filteredConsoleRecords() {
  const active = state.activeTasks.map((task, index) => ({ ...task, id: task.id || `active-${index}`, status: '投放中', created: '刚刚', createdDate: '2026-09-10', source: 'task', sourceIndex: index }));
  const history = state.records.map((record, index) => ({ ...record, id: `record-${index}`, productName: record.type === 'random' ? `${record.shown} 次推荐` : '指定 1 位语伴', created: record.date, createdDate: record.createdDate || `2026-08-${record.date.slice(-2)}`, source: 'record', sourceIndex: index }));
  const filter = state.adminRecordFilters;
  return [...active, ...history].filter(record => {
    if (filter.type !== 'all' && record.type !== filter.type) return false;
    if (filter.status !== 'all' && record.status !== filter.status) return false;
    if (filter.date === '7d') return record.createdDate >= '2026-09-03';
    if (filter.date === '30d') return record.createdDate >= '2026-08-11';
    return true;
  });
}

function consoleRecordRows() {
  return filteredConsoleRecords().map(record => `<tr><td>${record.id}</td><td>C*${record.type === 'random' ? 'm' : 'z'}</td><td>${typeLabel(record.type)}</td><td>${record.productName || '开屏推荐商品'}</td><td>${record.photoSource === 'album' ? '照片' : '头像'} · ${styleNames[record.style] || styleNames[0]}</td><td><span class="record-status ${record.status === '投放中' ? 'is-running' : ''}">${record.status}</span></td><td>${record.type === 'random' ? `${record.shown || 0} / ${record.total || record.shown || 0}` : record.name || '—'}</td><td>${record.type === 'random' ? `${record.visitors ?? '—'} 人` : '—'}</td><td>${record.created}</td><td><button class="table-link" data-backend-action="preview-record" data-record-source="${record.source}" data-record-index="${record.sourceIndex}">预览</button></td></tr>`).join('') || '<tr><td colspan="10" class="admin-empty">暂无符合条件的投放记录</td></tr>';
}

function renderRecordsPage() {
  const filter = state.adminRecordFilters;
  return `<div class="admin-page-head"><div><h2>投放记录</h2><p>查看随机推荐与指定语伴的投放结果。</p></div></div><section class="admin-filter"><label>投放类型<select data-backend-action="record-filter" data-record-filter="type"><option value="all" ${filter.type === 'all' ? 'selected' : ''}>全部类型</option><option value="random" ${filter.type === 'random' ? 'selected' : ''}>随机推荐</option><option value="designated" ${filter.type === 'designated' ? 'selected' : ''}>指定语伴</option></select></label><label>投放状态<select data-backend-action="record-filter" data-record-filter="status"><option value="all" ${filter.status === 'all' ? 'selected' : ''}>全部状态</option><option value="投放中" ${filter.status === '投放中' ? 'selected' : ''}>投放中</option><option value="投放完成" ${filter.status === '投放完成' ? 'selected' : ''}>投放完成</option><option value="已展示" ${filter.status === '已展示' ? 'selected' : ''}>已展示</option><option value="未展示" ${filter.status === '未展示' ? 'selected' : ''}>未展示</option></select></label><label>创建时间<select data-backend-action="record-filter" data-record-filter="date"><option value="all" ${filter.date === 'all' ? 'selected' : ''}>全部时间</option><option value="7d" ${filter.date === '7d' ? 'selected' : ''}>近 7 天</option><option value="30d" ${filter.date === '30d' ? 'selected' : ''}>近 30 天</option></select></label><button class="admin-search" data-backend-action="search-records">查询</button><button class="admin-reset" data-backend-action="reset-records">重置</button></section><section class="admin-card"><div class="admin-card-head"><strong>投放记录</strong><span>共 ${filteredConsoleRecords().length} 条数据</span></div><div class="admin-table-wrap"><table class="admin-table records-table"><thead><tr><th>记录 ID</th><th>用户</th><th>投放类型</th><th>商品快照</th><th>开屏封面</th><th>状态</th><th>投放进度 / 对象</th><th>访客数</th><th>创建时间</th><th>操作</th></tr></thead><tbody>${consoleRecordRows()}</tbody></table></div></section>`;
}

function renderProductDialog() {
  if (!state.adminDialog) return '';
  const { mode, productId } = state.adminDialog;
  const type = state.backendType;
  const dialogType = state.adminDialogType || type;
  const product = mode === 'edit' ? productById(dialogType, productId) : { name: '', recommendCount: dialogType === 'random' ? 500 : 1, exposureCount: dialogType === 'random' ? 500 : 1, price: dialogType === 'random' ? 590 : 99, listPrice: dialogType === 'random' ? 690 : 119, displayPrice: dialogType === 'random' ? 690 : 119, firstPrice: dialogType === 'random' ? 590 : 99, actualPrice: dialogType === 'random' ? 590 : 99, vipPrice: dialogType === 'random' ? 590 : 99, enabled: true };
  const value = (key, fallback = '') => product[key] ?? fallback;
  const field = (label, id, fieldValue, unit, note = '', required = false) => `<div class="admin-config-field"><label>${required ? '<b>*</b>' : ''}${label}</label><div><div class="admin-unit-input"><input id="${id}" type="number" min="1" value="${fieldValue}" /><span>${unit}</span></div>${note ? `<p>${note}</p>` : ''}</div></div>`;
  const exposureNote = dialogType === 'random' ? '范围为 500 至 10000，且必须是 500 的倍数。' : '指定语伴商品固定曝光 1 次。';
  const settings = `<div class="admin-config-form"><div class="admin-config-field admin-config-name"><label><b>*</b>商品名称</label><div><input id="adminProductName" required value="${value('name')}" placeholder="请输入商品名称" /></div></div><div class="admin-config-field"><label><b>*</b>投放类型</label><div><select id="adminProductType" data-backend-action="dialog-type" ${mode === 'edit' ? 'disabled' : ''}><option value="random" ${dialogType === 'random' ? 'selected' : ''}>随机推荐</option><option value="designated" ${dialogType === 'designated' ? 'selected' : ''}>指定语伴</option></select><p>${mode === 'edit' ? '编辑时不可修改商品所属投放类型。' : '请选择该商品用于随机推荐还是指定语伴。'}</p></div></div><div class="admin-config-status"><span>状态</span><label class="admin-status-switch"><input id="adminProductEnabled" type="checkbox" ${product.enabled ? 'checked' : ''} /><i>启用</i></label></div>${field('显示原价', 'adminProductDisplayPrice', value('displayPrice', value('listPrice', 1190)), 'coins', '客户端原价会展示划线价，和实际价格对比。', true)}${field('首次购买价格', 'adminProductFirstPrice', value('firstPrice', value('price', 990)), 'coins', '从未购买过的用户首次体验价，不区分 VIP 还是非 VIP。', true)}<div class="admin-config-field"><label>首次购买角标</label><div><select id="adminProductFirstBadge"><option>不展示</option><option>限时优惠</option><option>新人专享</option></select><p>占位符类型为商业化，不填写则显示客户端默认值。</p></div></div>${field('实际价格', 'adminProductActualPrice', value('actualPrice', value('price', 990)), 'coins', '享受过体验价后的固定实际价格。', true)}${field('VIP价格', 'adminProductVipPrice', value('vipPrice', value('price', 990)), 'coins', '配置后仅针对 VIP 用户生效。', true)}<div class="admin-config-field"><label>VIP价格角标</label><div><select id="adminProductVipBadge"><option>不展示</option><option>VIP专享</option><option>限时优惠</option></select><p>占位符类型为商业化，不填写则显示客户端默认值。</p></div></div><div class="admin-config-field"><label>VIP价格限时角标</label><div><select id="adminProductVipLimitBadge"><option>不展示</option><option>限时优惠</option><option>即将结束</option></select><p>占位符类型为商业化，不填写则显示客户端默认值。</p></div></div>${field('曝光次数', 'adminProductExposureCount', value('exposureCount', value('recommendCount', 500)), '次', exposureNote, true)}</div>`;
  const numericFields = ['displayPrice', 'firstPrice', 'actualPrice', 'vipPrice'];
  const hasPrices = numericFields.every(key => Number(value(key, 0)) > 0);
  const initialExposure = Number(value('exposureCount', dialogType === 'random' ? 500 : 1));
  const exposureValid = dialogType === 'random' ? initialExposure >= 500 && initialExposure % 500 === 0 : initialExposure === 1;
  const canSave = Boolean(value('name').trim()) && hasPrices && exposureValid;
  return `<div class="admin-dialog-backdrop"><section class="admin-dialog admin-config-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title"><header><h3 id="admin-dialog-title">${mode === 'edit' ? 'Edit' : 'Add'}</h3><button data-backend-action="close-dialog" aria-label="关闭">×</button></header><main>${settings}</main><footer><button class="admin-cancel" data-backend-action="close-dialog">取消</button><button class="admin-primary" data-backend-action="save-product" data-product-id="${productId || ''}" ${canSave ? '' : 'disabled'}>确认</button></footer></section></div>`;
}

function renderBackendConsole() {
  if (!backendConsole) return;
  const type = state.backendType;
  const page = state.adminPage;
  const content = page === 'products' ? renderProductPage(type) : page === 'placement' ? renderPlacementPage(type) : renderRecordsPage();
  backendConsole.innerHTML = `<section class="admin-frame"><section class="admin-workspace admin-workspace-compact"><header class="admin-localbar"><strong>开屏推荐</strong><nav class="admin-tabs" aria-label="开屏推荐后台页签"><button class="${page === 'products' ? 'is-active' : ''}" data-backend-action="page" data-backend-page="products">商品配置</button><button class="${page === 'placement' ? 'is-active' : ''}" data-backend-action="page" data-backend-page="placement">商品分组</button><button class="${page === 'records' ? 'is-active' : ''}" data-backend-action="page" data-backend-page="records">投放记录</button></nav></header><main class="admin-content">${content}</main></section></section>${renderProductDialog()}${renderPlacementDialog()}${renderPlacementImportDialog()}`;
}

function render() {
  let html = '';
  if (state.view === 'friends') html = renderFriends();
  else if (state.view === 'placement-detail') html = renderPlacementDetail();
  else if (state.view === 'partner-info') html = renderPartnerInfo();
  else if (state.view === 'records') html = renderRecords();
  else if (state.view === 'splash-preview') html = renderSplashPreview();
  else html = renderMain();
  app.className = `app ${state.review ? 'is-review' : ''}`;
  app.innerHTML = html + overlay();
  renderBackendConsole();
  renderDemoTools();
  requestAnimationFrame(drawConnectors);
}

function renderDemoTools() {
  const status = document.querySelector('#demoStateText');
  const finish = document.querySelector('[data-control="finish-latest"]');
  const completion = document.querySelector('[data-control="show-completion"]');
  if (!status || !finish || !completion) return;
  const latest = state.activeTasks[0];
  const active = latest
    ? latest.type === 'random'
      ? `全站 · ${latest.shown} / ${latest.total} 人${partnerStats(latest).total ? ` + 指定 ${partnerStats(latest).total} 位` : ''}`
      : `指定 · ${partnerStats(latest).total} 位 · ${latest.remaining} 小时`
    : '无';
  const notice = state.completionNotice ? '待查看' : '未显示';
  status.textContent = `进行中：${active} · 回访通知：${notice}`;
  finish.disabled = !latest;
  completion.disabled = !state.completionNotice;
}

function setView(view) { state.view = view; state.overlay = null; state.overlayEntered = true; render(); }

function showOverlay(type) {
  state.overlay = type;
  state.overlayEntered = false;
  render();
  requestAnimationFrame(() => { state.overlayEntered = true; });
}

function addTask(type) {
  const product = selectedProduct(type);
  if (!product) return;
  const partners = state.selectedFriends.map(friend => ({ ...friend, status: '等待打开 App', remaining: 42 }));
  state.activeTasks.unshift({
    id: Date.now(),
    type,
    productId: product.id,
    productName: product.name,
    price: type === 'random' ? product.price + designatedPrice() : designatedPrice(),
    total: type === 'random' ? product.recommendCount : 0,
    shown: type === 'random' ? Math.min(128, product.recommendCount) : 0,
    visitors: type === 'random' ? 9 : 0,
    remaining: 42,
    partners,
    photoSource: state.photoSource,
    style: state.template,
    copy: state.copy
  });
}

function finishLatest() {
  const task = state.activeTasks.shift();
  if (!task) return;
  const duration = `${String(Math.max(0, 48 - (task.remaining ?? 48))).padStart(2, '0')}:00:00`;
  let record;
  const partners = partnersOf(task).map((partner, index) => ({ ...partner, status: index % 3 === 2 ? '未展示' : '已展示', remaining: 0 }));
  if (task.type === 'random') {
    const shown = task.total || task.shown;
    record = { type: 'random', date: '刚刚', shown, visitors: Math.max(task.visitors ?? 0, Math.round(shown * .07)), status: '投放完成', partners, photoSource: task.photoSource, style: task.style };
  } else {
    record = { type: 'designated', date: '刚刚', status: partners.every(partner => partner.status === '已展示') ? '已展示' : '投放结束', partners, photoSource: task.photoSource, style: task.style };
  }
  state.records.unshift(record);
  state.completionNotice = { type: record.type, status: record.status, shown: record.shown || 0, total: task.total || 0, visitors: record.visitors || 0, partners, duration };
  persistCompletionNotice(state.completionNotice);
}

function simulateCompletion(type, status) {
  const isRandom = type === 'random';
  const isComplete = status === 'complete';
  const isShown = status === 'shown';
  state.activeTasks = [];
  state.completionNotice = isRandom
    ? {
      type: 'random',
      status: isComplete ? '投放完成' : '未完整展示',
      shown: isComplete ? 500 : 128,
      total: 500,
      visitors: isComplete ? 35 : 9,
      duration: isComplete ? '06:00:00' : '48:00:00',
      partners: isComplete
        ? [{ ...friendOptions[0], status: '已展示' }, { ...friendOptions[1], status: '已展示' }, { ...friendOptions[2], status: '未展示' }]
        : [{ ...friendOptions[0], status: '已展示' }, { ...friendOptions[1], status: '未展示' }]
    }
    : {
      type: 'designated',
      status: isShown ? '已展示' : '未展示',
      shown: 0,
      total: 0,
      visitors: 0,
      duration: isShown ? '06:00:00' : '48:00:00',
      partners: isShown
        ? [{ ...friendOptions[0], status: '已展示' }, { ...friendOptions[1], status: '已展示' }, { ...friendOptions[2], status: '未展示' }]
        : [{ ...friendOptions[0], status: '未展示' }, { ...friendOptions[1], status: '未展示' }]
    };
  persistCompletionNotice(state.completionNotice);
  showOverlay('completion');
}

app.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.classList.contains('overlay')) {
    if (state.overlay === 'completion') {
      state.completionNotice = null;
      persistCompletionNotice(null);
    }
    if (state.overlay === 'audience') {
      state.audienceTask = null;
      const origin = state.audienceOrigin;
      state.audienceOrigin = null;
      showOverlay(origin === 'history' ? 'records' : 'active-tasks');
    } else {
      state.overlay = null;
      state.overlayEntered = true;
      render();
    }
    return;
  }
  const element = event.target.closest('[data-action], [data-rule-anchor]');
  if (!element) { if (state.modeHelp) { state.modeHelp = null; render(); } return; }
  if (element.dataset.ruleAnchor) { selectRuleByTarget(element.dataset.ruleAnchor); return; }
  const action = element.dataset.action;
  if (action === 'mode-help') { state.modeHelp = state.modeHelp === element.dataset.help ? null : element.dataset.help; render(); return; }
  if (action === 'open-active-task') {
    if (state.activeTasks.length) showOverlay('active-tasks');
    return;
  }
  if (action === 'open-latest-preview') {
    if (state.activeTasks.length) {
      state.previewItem = state.activeTasks[0];
      state.previewOrigin = 'main';
      state.previewSaved = false;
      setView('splash-preview');
    }
    return;
  }
  if (action === 'open-preview') {
    const index = Number(element.dataset.previewIndex);
    state.previewItem = element.dataset.previewSource === 'record' ? state.records[index] : state.activeTasks[index];
    state.previewOrigin = element.dataset.previewSource === 'record' ? 'history' : 'active-tasks';
    state.previewSaved = false;
    setView('splash-preview');
    return;
  }
  if (action === 'open-placement-detail') {
    state.placementDetail = state.previewItem;
    setView('placement-detail');
    return;
  }
  if (action === 'open-detail-preview') {
    state.previewItem = state.placementDetail;
    state.previewOrigin = 'record-detail';
    state.previewSaved = false;
    setView('splash-preview');
    return;
  }
  if (action === 'placement-detail-back') {
    state.placementDetail = null;
    state.view = 'main';
    showOverlay('records');
    return;
  }
  if (action === 'open-partner-info') {
    state.partnerInfo = { name: element.dataset.name, initial: element.dataset.initial, className: element.dataset.class, active: element.dataset.active !== 'false' };
    setView('partner-info');
    return;
  }
  if (action === 'partner-info-back') {
    state.partnerInfo = null;
    state.view = 'main';
    showOverlay('active-tasks');
    return;
  }
  if (action === 'open-audience') {
    state.audienceOrigin = element.dataset.audienceSource === 'record' ? 'history' : 'active-tasks';
    state.audienceTask = state.audienceOrigin === 'history'
      ? state.records[Number(element.dataset.audienceIndex)]
      : state.activeTasks[Number(element.dataset.audienceIndex)];
    state.audienceTab = element.dataset.audienceTab || 'shown';
    showOverlay('audience');
    return;
  }
  if (action === 'open-partner-status') {
    const source = element.dataset.partnerSource;
    const index = Number(element.dataset.partnerIndex || 0);
    const item = source === 'task' ? state.activeTasks[index]
      : source === 'record' ? state.records[index]
        : source === 'detail' ? state.placementDetail
          : state.completionNotice;
    state.partnerStatusItems = partnersOf(item);
    state.partnerStatusOrigin = source === 'record' ? 'records' : source === 'task' ? 'active-tasks' : source === 'detail' ? 'placement-detail' : 'completion';
    showOverlay('partner-status');
    return;
  }
  if (action === 'partner-status-close') {
    const origin = state.partnerStatusOrigin;
    state.partnerStatusItems = [];
    state.partnerStatusOrigin = null;
    if (origin === 'completion') showOverlay('completion');
    else if (origin === 'placement-detail') { state.overlay = null; state.overlayEntered = true; render(); }
    else showOverlay(origin === 'records' ? 'records' : 'active-tasks');
    return;
  }
  if (action === 'audience-tab') {
    state.audienceTab = element.dataset.audienceTab || 'shown';
    render();
    return;
  }
  if (action === 'audience-close') {
    state.audienceTask = null;
    const origin = state.audienceOrigin;
    state.audienceOrigin = null;
    showOverlay(origin === 'history' ? 'records' : 'active-tasks');
    return;
  }
  if (action === 'preview-back') {
    const origin = state.previewOrigin;
    state.previewItem = null;
    state.previewOrigin = null;
    state.previewSaved = false;
    state.view = 'main';
    if (origin === 'history') showOverlay('records');
    else if (origin === 'record-detail') { state.view = 'placement-detail'; render(); }
    else if (origin === 'active-tasks') showOverlay('active-tasks');
    else render();
    return;
  }
  if (action === 'save-preview-image') {
    downloadPreviewImage(state.previewItem || state.activeTasks[0] || { photoSource: state.photoSource, style: state.template, copy: state.copy });
    state.previewSaved = true;
    render();
    window.setTimeout(() => {
      if (!state.previewSaved) return;
      state.previewSaved = false;
      if (state.view === 'splash-preview') render();
    }, 1800);
    return;
  }
  if (action === 'completion-close') {
    state.completionNotice = null;
    persistCompletionNotice(null);
    state.overlay = null;
    state.overlayEntered = true;
    render();
    return;
  }
  if (action === 'completion-repeat') {
    const mode = element.dataset.mode;
    const partners = partnersOf(state.completionNotice);
    state.completionNotice = null;
    persistCompletionNotice(null);
    state.mode = mode === 'designated' ? 'designated' : 'random';
    state.selectedFriends = partners.map(({ name, initial, className }) => ({ name, initial, className }));
    state.selectedFriend = state.selectedFriends[0] || null;
    state.overlay = null;
    state.overlayEntered = true;
    render();
    return;
  }
  if (action === 'nav') setView(element.dataset.target);
  if (action === 'open-records') showOverlay('records');
  if (action === 'copy-record') { state.overlay = null; state.overlayEntered = true; render(); }
  if (action === 'repeat-random') { const record = state.records[Number(element.dataset.recordIndex)]; state.mode = 'random'; state.selectedFriends = partnersOf(record).map(({ name, initial, className }) => ({ name, initial, className })); state.selectedFriend = state.selectedFriends[0] || null; state.overlay = null; state.overlayEntered = true; render(); }
  if (action === 'repeat-designated') { const record = state.records[Number(element.dataset.recordIndex)]; state.mode = 'designated'; state.selectedFriends = partnersOf(record).map(({ name, initial, className }) => ({ name, initial, className })); state.selectedFriend = state.selectedFriends[0] || null; state.overlay = null; state.overlayEntered = true; render(); }
  if (action === 'close') { state.view = 'main'; render(); }
  if (action === 'mode') {
    if (element.dataset.mode === 'designated' && !selectedProduct('designated')) return;
    state.mode = element.dataset.mode;
    state.modeHelp = null;
    render();
  }
  if (action === 'audience') {
    state.audience = element.dataset.audience;
    state.modeHelp = null;
    if (state.audience === 'custom') showOverlay('custom-audience');
    else render();
    return;
  }
  if (action === 'custom-filter') return;
  if (action === 'custom-gender') { state.customGender = element.dataset.gender; render(); return; }
  if (action === 'custom-reset') { state.customGender = '全部'; render(); return; }
  if (action === 'custom-confirm') { state.overlay = null; state.overlayEntered = true; render(); return; }
  if (action === 'package') { state.selectedProductIds.random = element.dataset.productId; render(); }
  if (action === 'agreement') { state.agreed = !state.agreed; render(); }
  if (action === 'photo-sheet') showOverlay('photo');
  if (action === 'open-template') showOverlay('template');
  if (action === 'photo-select') { state.photoSelected = true; state.photoSource = element.dataset.source || 'avatar'; state.overlay = null; render(); }
  if (action === 'template') { state.template = Number(element.dataset.template); render(); }
  if (action === 'copy') { state.copy = Number(element.dataset.copy); render(); }
  if (action === 'refresh-copy') { state.copy = (state.copy + 1) % 3; render(); }
  if (action === 'preview-template') showOverlay('preview');
  if (action === 'cover-done') { state.templateSelected = true; state.overlay = null; render(); }
  if (action === 'open-friends') { state.friendDraft = [...state.selectedFriends]; setView('friends'); }
  if (action === 'friend') {
    const friend = { name: element.dataset.name, initial: element.dataset.initial, className: element.dataset.class };
    const exists = state.friendDraft.some(item => item.name === friend.name);
    if (exists) { state.friendDraft = state.friendDraft.filter(item => item.name !== friend.name); render(); return; }
    if (state.friendDraft.length >= 10) return;
    if (element.dataset.active === 'false') { state.pendingFriend = friend; showOverlay('inactive'); }
    else { state.friendDraft = [...state.friendDraft, friend]; render(); }
  }
  if (action === 'confirm-inactive') { state.friendDraft = [...state.friendDraft, state.pendingFriend]; state.pendingFriend = null; state.overlay = null; state.overlayEntered = true; render(); }
  if (action === 'friend-confirm') { state.selectedFriends = [...state.friendDraft]; state.selectedFriend = state.selectedFriends[0] || null; setView('main'); }
  if (action === 'submit') {
    if (!state.photoSelected) { showOverlay('photo'); return; }
    if (!state.templateSelected) { showOverlay('template'); return; }
    if (state.mode === 'designated' && !state.selectedFriends.length) { state.friendDraft = [...state.selectedFriends]; setView('friends'); return; }
    if (!state.agreed) { render(); return; }
    addTask(state.mode);
    showOverlay('created');
  }
  if (action === 'overlay-close') { state.overlay = null; state.overlayEntered = true; render(); }
});

backendConsole?.addEventListener('click', (event) => {
  const control = event.target.closest('[data-backend-action]');
  if (!control) return;
  const action = control.dataset.backendAction;
  const type = state.backendType;
  if (action === 'page') { state.adminPage = control.dataset.backendPage; renderBackendConsole(); return; }
  if (action === 'edit-product') { state.adminDialog = { mode: 'edit', productId: control.dataset.productId }; state.adminDialogType = state.backendType; renderBackendConsole(); return; }
  if (action === 'new-product') { state.adminDialog = { mode: 'create' }; state.adminDialogType = state.backendType; renderBackendConsole(); return; }
  if (action === 'close-dialog') { state.adminDialog = null; state.adminDialogType = null; renderBackendConsole(); return; }
  if (action === 'new-placement') { state.adminPlacementDialog = { mode: 'create' }; state.adminPlacementDraftIds = []; state.adminPlacementDraft = { name: '', description: '', category: '开屏推荐' }; renderBackendConsole(); return; }
  if (action === 'open-import-dialog') { state.adminImportDialog = true; state.adminImportText = ''; renderBackendConsole(); return; }
  if (action === 'close-import-dialog') { state.adminImportDialog = false; state.adminImportText = ''; renderBackendConsole(); return; }
  if (action === 'read-clipboard') {
    if (!navigator.clipboard?.readText) return;
    navigator.clipboard.readText().then(text => {
      state.adminImportText = text;
      renderBackendConsole();
    }).catch(() => {
      const status = backendConsole.querySelector('.admin-import-status');
      if (status) status.textContent = '无法读取剪贴板，请手动粘贴内容。';
    });
    return;
  }
  if (action === 'save-import-group') {
    const parsed = parsePlacementImport(state.adminImportText, type);
    if (!parsed.isValid) return;
    productGroups[type].push({ id: `group-${type === 'random' ? 'r' : 'd'}-${Date.now().toString().slice(-4)}`, category: '开屏推荐', ...parsed });
    state.adminImportDialog = false;
    state.adminImportText = '';
    renderBackendConsole();
    return;
  }
  if (action === 'edit-placement') { const group = productGroups[type].find(item => item.id === control.dataset.groupId); state.adminPlacementDialog = { mode: 'edit', groupId: control.dataset.groupId }; state.adminPlacementDraftIds = [...(group?.productIds || [])]; state.adminPlacementDraft = { name: group?.name || '', description: group?.description || '', category: group?.category || '开屏推荐' }; renderBackendConsole(); return; }
  if (action === 'copy-placement') { const group = productGroups[type].find(item => item.id === control.dataset.groupId); if (group) { const copy = { ...group, id: `group-${type === 'random' ? 'r' : 'd'}-${Date.now().toString().slice(-4)}`, name: `${group.name}（副本）`, productIds: [...group.productIds] }; productGroups[type].push(copy); } renderBackendConsole(); return; }
  if (action === 'set-default-group') { const group = productGroups[type].find(item => item.id === control.dataset.groupId); if (group) { defaultGroupIds[type] = group.id; placementConfig[type].productIds = [...group.productIds]; placementConfig[type].defaultId = group.productIds[0] || null; normalizePlacement(type); } render(); return; }
  if (action === 'close-placement-dialog') { state.adminPlacementDialog = null; state.adminPlacementDraftIds = []; state.adminPlacementDraft = { name: '', description: '', category: '开屏推荐' }; renderBackendConsole(); return; }
  if (action === 'save-placement-group') {
    const name = backendConsole.querySelector('#adminGroupName')?.value.trim();
    const description = backendConsole.querySelector('#adminGroupDescription')?.value.trim() || '';
    const category = backendConsole.querySelector('#adminGroupCategory')?.value || '开屏推荐';
    const productIds = [...(state.adminPlacementDraftIds || [])];
    if (!name || !description || !productIds.length) return;
    const dialog = state.adminPlacementDialog;
    let group = dialog.groupId ? productGroups[type].find(item => item.id === dialog.groupId) : null;
    if (group) Object.assign(group, { name, description, category, productIds });
    else { group = { id: `group-${type === 'random' ? 'r' : 'd'}-${Date.now().toString().slice(-4)}`, category, name, description, productIds }; productGroups[type].push(group); }
    defaultGroupIds[type] = group.id;
    placementConfig[type].productIds = [...productIds];
    placementConfig[type].defaultId = productIds[0] || null;
    normalizePlacement(type);
    state.adminPlacementDialog = null;
    state.adminPlacementDraftIds = [];
    state.adminPlacementDraft = { name: '', description: '', category: '开屏推荐' };
    render();
    return;
  }
  if (action === 'move-up' || action === 'move-down') {
    const ids = placementConfig[type].productIds;
    const index = ids.indexOf(control.dataset.productId);
    const next = action === 'move-up' ? index - 1 : index + 1;
    if (index >= 0 && next >= 0 && next < ids.length) [ids[index], ids[next]] = [ids[next], ids[index]];
    render();
    return;
  }
  if (action === 'save-product') {
    const values = productDialogValues();
    if (!values.isValid) { syncProductDialogValidity(); return; }
    const name = values.name;
    const displayPrice = Number(values.displayPrice);
    const firstPrice = Number(values.firstPrice);
    const actualPrice = Number(values.actualPrice);
    const vipPrice = Number(values.vipPrice);
    const exposureCount = Number(values.exposure);
    const enabled = backendConsole.querySelector('#adminProductEnabled')?.checked ?? true;
    const dialogType = state.adminDialogType || type;
    let product = control.dataset.productId ? productById(dialogType, control.dataset.productId) : null;
    if (!product) {
      const suffix = dialogType === 'random' ? exposureCount : Date.now().toString().slice(-4);
      product = { id: `open-${dialogType === 'random' ? 'r' : 'd'}-${suffix}-${Date.now().toString().slice(-3)}`, name, recommendCount: dialogType === 'random' ? exposureCount : 1, exposureCount, price: actualPrice, listPrice: displayPrice, displayPrice, firstPrice, actualPrice, vipPrice, enabled };
      productCatalog[dialogType].push(product);
    } else {
      Object.assign(product, { name, recommendCount: dialogType === 'random' ? exposureCount : 1, exposureCount, price: actualPrice, listPrice: displayPrice, displayPrice, firstPrice, actualPrice, vipPrice, enabled });
    }
    normalizePlacement(dialogType);
    state.adminDialog = null;
    state.adminDialogType = null;
    render();
    return;
  }
  if (action === 'preview-record') {
    const source = control.dataset.recordSource;
    const index = Number(control.dataset.recordIndex);
    state.previewItem = source === 'task' ? state.activeTasks[index] : state.records[index];
    state.previewOrigin = 'backend-record';
    state.previewSaved = false;
    setView('splash-preview');
    return;
  }
  if (action === 'search-records') { renderBackendConsole(); return; }
  if (action === 'reset-records') { state.adminRecordFilters = { type: 'all', status: 'all', date: 'all' }; renderBackendConsole(); return; }
});

backendConsole?.addEventListener('change', (event) => {
  const control = event.target.closest('[data-backend-action]');
  if (!control) return;
  const type = state.backendType;
  const product = productById(type, control.dataset.productId);
  const action = control.dataset.backendAction;
  if (action === 'type') {
    state.backendType = control.value;
    state.adminDialog = null;
    renderBackendConsole();
    return;
  }
  if (action === 'dialog-type' && state.adminDialog?.mode === 'create') {
    state.adminDialogType = control.value;
    renderBackendConsole();
    return;
  }
  if (action === 'record-filter') {
    state.adminRecordFilters = { ...state.adminRecordFilters, [control.dataset.recordFilter]: control.value };
    return;
  }
  if (action === 'placement-pick') {
    state.adminPlacementDraft = { name: backendConsole.querySelector('#adminGroupName')?.value || '', description: backendConsole.querySelector('#adminGroupDescription')?.value || '', category: backendConsole.querySelector('#adminGroupCategory')?.value || '开屏推荐' };
    const ids = [...(state.adminPlacementDraftIds || [])];
    const max = type === 'random' ? 4 : 1;
    if (control.checked) {
      if (!ids.includes(control.dataset.productId) && ids.length < max) ids.push(control.dataset.productId);
    } else {
      state.adminPlacementDraftIds = ids.filter(id => id !== control.dataset.productId);
    }
    if (control.checked) state.adminPlacementDraftIds = ids;
    renderBackendConsole();
    return;
  }
  if (action === 'enabled' && product) {
    product.enabled = control.checked;
    normalizePlacement(type);
  }
  if (action === 'price' && product) {
    const field = control.dataset.backendField;
    product[field] = Math.max(1, Number(control.value) || product[field]);
  }
  if (action === 'placement' && product) {
    const ids = placementConfig[type].productIds;
    if (control.checked) {
      const max = type === 'random' ? 4 : 1;
      if (ids.length < max && product.enabled) ids.push(product.id);
    } else {
      placementConfig[type].productIds = ids.filter(id => id !== product.id);
    }
    normalizePlacement(type);
  }
  if (action === 'default' && product && placementConfig[type].productIds.includes(product.id)) {
    placementConfig[type].defaultId = product.id;
    state.selectedProductIds[type] = product.id;
  }
  render();
});

backendConsole?.addEventListener('input', (event) => {
  if (!state.adminDialog && !state.adminPlacementDialog && !state.adminImportDialog) return;
  const target = event.target;
  if (state.adminPlacementDialog && (target.id === 'adminGroupName' || target.id === 'adminGroupDescription')) {
    const name = backendConsole.querySelector('#adminGroupName')?.value.trim() || '';
    const description = backendConsole.querySelector('#adminGroupDescription')?.value.trim() || '';
    state.adminPlacementDraft = {
      name,
      description,
      category: backendConsole.querySelector('#adminGroupCategory')?.value || '开屏推荐'
    };
    const button = backendConsole.querySelector('[data-backend-action="save-placement-group"]');
    if (button) button.disabled = !(name && description && (state.adminPlacementDraftIds || []).length);
  }
  if (state.adminDialog && ['adminProductName', 'adminProductDisplayPrice', 'adminProductFirstPrice', 'adminProductActualPrice', 'adminProductVipPrice', 'adminProductExposureCount'].includes(target.id)) syncProductDialogValidity();
  if (state.adminImportDialog && target.id === 'adminImportText') {
    state.adminImportText = target.value;
    const button = backendConsole.querySelector('[data-backend-action="save-import-group"]');
    if (button) button.disabled = !parsePlacementImport(state.adminImportText, state.backendType).isValid;
  }
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
  if (control === 'create-random') { state.selectedFriends = friendOptions.slice(0, 3).map(({ name, initial, className }) => ({ name, initial, className })); addTask('random'); }
  if (control === 'create-designated') { state.selectedFriends = friendOptions.slice(0, 3).map(({ name, initial, className }) => ({ name, initial, className })); addTask('designated'); }
  if (control === 'completion-random-complete') return simulateCompletion('random', 'complete');
  if (control === 'completion-random-partial') return simulateCompletion('random', 'partial');
  if (control === 'completion-designated-shown') return simulateCompletion('designated', 'shown');
  if (control === 'completion-designated-unshown') return simulateCompletion('designated', 'unshown');
  if (control === 'finish-latest') {
    finishLatest();
    if (state.completionNotice) {
      showOverlay('completion');
      return;
    }
  }
  if (control === 'show-completion' && state.completionNotice) {
    showOverlay('completion');
    return;
  }
  if (control === 'clear-completion') {
    state.completionNotice = null;
    if (state.overlay === 'completion') state.overlay = null;
    persistCompletionNotice(null);
  }
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
