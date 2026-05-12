/**
 * AgriSense AI - Potato Disease Detection
 * Frontend controller: upload, preview, prediction, history
 */

// ── State ──────────────────────────────────────────
const state = {
  selectedFile: null,
  history: JSON.parse(localStorage.getItem('agrisense_history') || '[]'),
  currentResult: null,
};

// ── DOM References ─────────────────────────────────
const dom = {
  form:          () => document.getElementById('uploadForm'),
  dropZone:      () => document.getElementById('dropZone'),
  dropContent:   () => document.getElementById('dropContent'),
  fileInput:     () => document.getElementById('fileInput'),
  previewContainer: () => document.getElementById('previewContainer'),
  imagePreview:  () => document.getElementById('imagePreview'),
  changeImageBtn:() => document.getElementById('changeImageBtn'),
  fileInfo:      () => document.getElementById('fileInfo'),
  fileName:      () => document.getElementById('fileName'),
  fileSize:      () => document.getElementById('fileSize'),
  removeFileBtn: () => document.getElementById('removeFileBtn'),
  errorMsg:      () => document.getElementById('errorMsg'),
  errorText:     () => document.getElementById('errorText'),
  analyzeBtn:    () => document.getElementById('analyzeBtn'),
  analyzeBtnText:() => document.getElementById('analyzeBtnText'),
  resultCard:    () => document.getElementById('resultCard'),
  loadingState:  () => document.getElementById('loadingState'),
  resultState:   () => document.getElementById('resultState'),
  resultIcon:    () => document.getElementById('resultIcon'),
  resultIconWrap:() => document.getElementById('resultIconWrap'),
  resultDisease: () => document.getElementById('resultDisease'),
  resultSeverity:() => document.getElementById('resultSeverity'),
  confidenceValue:()=> document.getElementById('confidenceValue'),
  confidenceFill:() => document.getElementById('confidenceFill'),
  confidenceBar: () => document.getElementById('confidenceBar'),
  allConfidences:() => document.getElementById('allConfidences'),
  resultDescription:()=>document.getElementById('resultDescription'),
  viewDetailsBtn:() => document.getElementById('viewDetailsBtn'),
  diseaseDetails:() => document.getElementById('diseaseDetails'),
  analyzedImage: () => document.getElementById('analyzedImage'),
  imageBadge:    () => document.getElementById('imageBadge'),
  badgeIcon:     () => document.getElementById('badgeIcon'),
  badgeLabel:    () => document.getElementById('badgeLabel'),
  imageTimestamp:() => document.getElementById('imageTimestamp'),
  symptomsList:  () => document.getElementById('symptomsList'),
  treatmentList: () => document.getElementById('treatmentList'),
  preventionList:() => document.getElementById('preventionList'),
  analyzeAnotherBtn:()=>document.getElementById('analyzeAnotherBtn'),
  printReportBtn:() => document.getElementById('printReportBtn'),
  historyEmpty:  () => document.getElementById('historyEmpty'),
  historyList:   () => document.getElementById('historyList'),
  historyActions:() => document.getElementById('historyActions'),
  clearHistoryBtn:()=>document.getElementById('clearHistoryBtn'),
  navbar:        () => document.getElementById('navbar'),
  navToggle:     () => document.getElementById('navToggle'),
  navLinks:      () => document.getElementById('navLinks'),
  step1:         () => document.getElementById('step1'),
  step2:         () => document.getElementById('step2'),
  step3:         () => document.getElementById('step3'),
};

// ── Helpers ────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function showError(msg) {
  dom.errorText().textContent = msg;
  dom.errorMsg().style.display = 'flex';
}

function clearError() {
  dom.errorMsg().style.display = 'none';
}

function severityClass(sev) {
  const map = { None: 'severity-none', Moderate: 'severity-moderate', High: 'severity-high' };
  return map[sev] || 'severity-none';
}

function buildList(ulEl, items, cls) {
  ulEl.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    if (cls) li.className = cls;
    li.textContent = item;
    ulEl.appendChild(li);
  });
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── File Handling ──────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    showError(`Invalid file type: "${file.type}". Please upload JPG, PNG, or WebP.`);
    return false;
  }
  if (file.size > 16 * 1024 * 1024) {
    showError('File exceeds 16 MB limit.');
    return false;
  }
  clearError();
  return true;
}

function applyFile(file) {
  if (!validateFile(file)) return;
  state.selectedFile = file;

  // Show preview
  const reader = new FileReader();
  reader.onload = e => {
    dom.imagePreview().src = e.target.result;
    dom.dropContent().style.display = 'none';
    dom.previewContainer().style.display = 'block';
  };
  reader.readAsDataURL(file);

  // Show file info
  dom.fileName().textContent = file.name;
  dom.fileSize().textContent = formatBytes(file.size);
  dom.fileInfo().style.display = 'flex';

  // Enable button
  dom.analyzeBtn().disabled = false;
  dom.analyzeBtn().setAttribute('aria-disabled', 'false');
  dom.analyzeBtnText().textContent = 'Analyze Leaf Disease';
}

function resetFile() {
  state.selectedFile = null;
  dom.fileInput().value = '';
  dom.dropContent().style.display = '';
  dom.previewContainer().style.display = 'none';
  dom.imagePreview().src = '';
  dom.fileInfo().style.display = 'none';
  dom.analyzeBtn().disabled = true;
  dom.analyzeBtn().setAttribute('aria-disabled', 'true');
  dom.analyzeBtnText().textContent = 'Select Image to Analyze';
  clearError();
}

// ── Drop Zone ──────────────────────────────────────
function initDropZone() {
  const dz = dom.dropZone();

  dz.addEventListener('click', () => {
    if (!dom.previewContainer().style.display || dom.previewContainer().style.display === 'none') {
      dom.fileInput().click();
    }
  });

  dz.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dom.fileInput().click(); }
  });

  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) applyFile(file);
  });

  dom.fileInput().addEventListener('change', e => {
    if (e.target.files[0]) applyFile(e.target.files[0]);
  });

  dom.removeFileBtn().addEventListener('click', e => { e.stopPropagation(); resetFile(); });
  dom.changeImageBtn().addEventListener('click', e => { e.stopPropagation(); dom.fileInput().click(); });
}

// ── Loading Steps Animation ────────────────────────
function animateLoadingSteps() {
  const steps = [dom.step1(), dom.step2(), dom.step3()];
  steps.forEach(s => { s.className = 'step'; });
  steps[0].classList.add('active');

  let i = 0;
  const iv = setInterval(() => {
    if (i < steps.length) {
      if (i > 0) { steps[i - 1].classList.remove('active'); steps[i - 1].classList.add('done'); }
      if (i < steps.length) steps[i].classList.add('active');
      i++;
    } else {
      clearInterval(iv);
    }
  }, 700);

  return iv;
}

// ── Prediction ─────────────────────────────────────
async function runPrediction() {
  if (!state.selectedFile) return;

  // Show result card with loading
  dom.resultCard().style.display = 'flex';
  dom.loadingState().style.display = 'block';
  dom.resultState().style.display = 'none';
  scrollTo('upload-section');

  const stepTimer = animateLoadingSteps();

  const formData = new FormData();
  formData.append('file', state.selectedFile);

  try {
    const resp = await fetch('/predict', { method: 'POST', body: formData });
    const data = await resp.json();
    clearInterval(stepTimer);

    if (!resp.ok || !data.success) {
      throw new Error(data.error || 'Prediction failed');
    }

    state.currentResult = data;
    displayResult(data);
  } catch (err) {
    clearInterval(stepTimer);
    dom.resultCard().style.display = 'none';
    showError(err.message || 'Network error. Please try again.');
  }
}

// ── Display Result ─────────────────────────────────
function displayResult(data) {
  const info = data.disease_info;
  const sev = info.severity;

  // Switch to result state
  dom.loadingState().style.display = 'none';
  dom.resultState().style.display = 'block';

  // Icon & heading
  dom.resultIcon().textContent = info.icon;
  dom.resultIconWrap().style.background = info.color + '22';
  dom.resultIconWrap().style.border = `1px solid ${info.color}55`;
  dom.resultDisease().textContent = data.prediction;
  dom.resultSeverity().textContent = `${sev} Risk`;
  dom.resultSeverity().className = `result-severity severity-badge ${severityClass(sev)}`;

  // Confidence bar (animate after short delay)
  setTimeout(() => {
    const pct = Math.round(data.confidence);
    dom.confidenceValue().textContent = pct + '%';
    dom.confidenceFill().style.width = pct + '%';
    dom.confidenceFill().style.background = info.color;
    dom.confidenceBar().setAttribute('aria-valuenow', pct);
  }, 100);

  // All confidence breakdown
  const acEl = dom.allConfidences();
  acEl.innerHTML = '';
  const colors = ['#10b981', '#f59e0b', '#ef4444'];
  Object.entries(data.all_confidences).forEach(([name, pct], idx) => {
    const row = document.createElement('div');
    row.className = 'conf-row';
    row.innerHTML = `<span class="conf-label">${name}</span>
      <div class="conf-track"><div class="conf-fill" style="background:${colors[idx % colors.length]}"></div></div>
      <span class="conf-val">${pct}%</span>`;
    acEl.appendChild(row);
    setTimeout(() => { row.querySelector('.conf-fill').style.width = pct + '%'; }, 200 + idx * 100);
  });

  // Description
  dom.resultDescription().textContent = info.description;

  // Scroll to result
  scrollTo('resultCard');

  // Save to history
  saveHistory(data);

  // Populate details section (hidden until user clicks View Report)
  populateDetails(data);
}

// ── Populate Full Report ───────────────────────────
function populateDetails(data) {
  const info = data.disease_info;
  dom.analyzedImage().src = data.image_url;
  dom.badgeIcon().textContent = info.icon;
  dom.badgeLabel().textContent = data.prediction;
  dom.imageTimestamp().textContent = '📅 Analyzed: ' + data.timestamp;
  buildList(dom.symptomsList(), info.symptoms);
  buildList(dom.treatmentList(), info.treatment);
  buildList(dom.preventionList(), info.prevention);
}

// ── History ────────────────────────────────────────
function saveHistory(data) {
  const entry = {
    id: Date.now(),
    disease: data.prediction,
    confidence: data.confidence,
    severity: data.disease_info.severity,
    icon: data.disease_info.icon,
    color: data.disease_info.color,
    imageUrl: data.image_url,
    timestamp: data.timestamp,
  };
  state.history.unshift(entry);
  if (state.history.length > 20) state.history = state.history.slice(0, 20);
  localStorage.setItem('agrisense_history', JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  const list = dom.historyList();
  list.innerHTML = '';

  if (state.history.length === 0) {
    dom.historyEmpty().style.display = 'block';
    dom.historyActions().style.display = 'none';
    return;
  }

  dom.historyEmpty().style.display = 'none';
  dom.historyActions().style.display = 'block';

  state.history.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.setAttribute('role', 'listitem');
    item.innerHTML = `
      <img class="history-thumb" src="${entry.imageUrl}" alt="${entry.disease}" onerror="this.style.display='none'" />
      <div class="history-info">
        <div class="history-disease">${entry.icon} ${entry.disease}</div>
        <div class="history-conf">Confidence: ${entry.confidence}%</div>
        <span class="history-sev ${severityClass(entry.severity)}">${entry.severity} Risk</span>
      </div>
      <div class="history-time">${entry.timestamp.split(' ')[1] || ''}<br/>${entry.timestamp.split(' ')[0] || ''}</div>`;
    list.appendChild(item);
  });
}

// ── Navbar ─────────────────────────────────────────
function initNavbar() {
  window.addEventListener('scroll', () => {
    dom.navbar().classList.toggle('scrolled', window.scrollY > 50);
  });

  dom.navToggle().addEventListener('click', () => {
    const open = dom.navLinks().classList.toggle('open');
    dom.navToggle().setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close mobile menu when a link is clicked
  dom.navLinks().querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      dom.navLinks().classList.remove('open');
      dom.navToggle().setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

// ── Event Wiring ───────────────────────────────────
function initEvents() {
  // Form submit
  dom.form().addEventListener('submit', e => {
    e.preventDefault();
    runPrediction();
  });

  // View full report
  dom.viewDetailsBtn().addEventListener('click', () => {
    const details = dom.diseaseDetails();
    const hidden = details.style.display === 'none' || !details.style.display;
    details.style.display = hidden ? 'block' : 'none';
    dom.viewDetailsBtn().setAttribute('aria-expanded', !hidden);
    if (hidden) setTimeout(() => scrollTo('diseaseDetails'), 50);
  });

  // Analyze another
  dom.analyzeAnotherBtn().addEventListener('click', () => {
    dom.diseaseDetails().style.display = 'none';
    dom.resultCard().style.display = 'none';
    resetFile();
    scrollTo('upload-section');
  });

  // Print
  dom.printReportBtn().addEventListener('click', () => window.print());

  // Clear history
  dom.clearHistoryBtn().addEventListener('click', () => {
    if (confirm('Clear all prediction history?')) {
      state.history = [];
      localStorage.removeItem('agrisense_history');
      renderHistory();
    }
  });

  // Hero CTA smooth scroll
  document.getElementById('heroAnalyzeBtn').addEventListener('click', e => {
    e.preventDefault();
    scrollTo('upload-section');
  });
}

// ── Init ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initDropZone();
  initEvents();
  renderHistory();

  // Intersection observer for section animations
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.about-card, .class-card, .glass-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    observer.observe(el);
  });
});
