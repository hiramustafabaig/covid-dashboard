/**
 * DSC327 - COVID-19 Dashboard
 * Data source: Kaggle COVID-19 dataset (worldometer_data.csv, day_wise.csv, country_wise_latest.csv)
 */

// ── Global state ──────────────────────────────────────────────────────────────
let globalData      = [];
let timeSeriesData  = [];
let currentMetric   = 'confirmed';
let currentRegion   = 'all';
let currentTopN     = 10;
let isAnimating     = true;
let lineChartMode   = 'cumulative'; // 'cumulative' | 'daily'

// ── Country name → ISO-2 code (worldometer naming) ───────────────────────────
const countryNameToISO2 = {
    'USA':'US','Brazil':'BR','India':'IN','Russia':'RU','South Africa':'ZA',
    'Mexico':'MX','Peru':'PE','Chile':'CL','Colombia':'CO','Spain':'ES',
    'Iran':'IR','UK':'GB','Saudi Arabia':'SA','Pakistan':'PK','Bangladesh':'BD',
    'Italy':'IT','Turkey':'TR','Argentina':'AR','Germany':'DE','France':'FR',
    'Iraq':'IQ','Philippines':'PH','Indonesia':'ID','Canada':'CA','Qatar':'QA',
    'Kazakhstan':'KZ','Egypt':'EG','Ecuador':'EC','Bolivia':'BO','Sweden':'SE',
    'Oman':'OM','Israel':'IL','Ukraine':'UA','Dominican Republic':'DO','Panama':'PA',
    'Belgium':'BE','Kuwait':'KW','Belarus':'BY','UAE':'AE','Romania':'RO',
    'Netherlands':'NL','Singapore':'SG','Guatemala':'GT','Portugal':'PT','Poland':'PL',
    'Nigeria':'NG','Honduras':'HN','Bahrain':'BH','Japan':'JP','Armenia':'AM',
    'Ghana':'GH','Kyrgyzstan':'KG','Afghanistan':'AF','Switzerland':'CH','Algeria':'DZ',
    'Azerbaijan':'AZ','Morocco':'MA','Uzbekistan':'UZ','Serbia':'RS','Moldova':'MD',
    'Ireland':'IE','Kenya':'KE','Venezuela':'VE','Nepal':'NP','Austria':'AT',
    'Costa Rica':'CR','Ethiopia':'ET','Australia':'AU','El Salvador':'SV','Czechia':'CZ',
    'Cameroon':'CM','Ivory Coast':'CI','S. Korea':'KR','Denmark':'DK','Palestine':'PS',
    'Bosnia and Herzegovina':'BA','Bulgaria':'BG','Madagascar':'MG','Sudan':'SD',
    'North Macedonia':'MK','Senegal':'SN','Norway':'NO','DRC':'CD','Malaysia':'MY',
    'French Guiana':'GF','Gabon':'GA','Tajikistan':'TJ','Guinea':'GN','Haiti':'HT',
    'Finland':'FI','Zambia':'ZM','Luxembourg':'LU','Mauritania':'MR','Paraguay':'PY',
    'Albania':'AL','Lebanon':'LB','Croatia':'HR','Djibouti':'DJ','Greece':'GR',
    'Libya':'LY','Equatorial Guinea':'GQ','Maldives':'MV','CAR':'CF','Hungary':'HU',
    'Malawi':'MW','Zimbabwe':'ZW','Nicaragua':'NI','Hong Kong':'HK','Congo':'CG',
    'Montenegro':'ME','Thailand':'TH','Somalia':'SO','Eswatini':'SZ','Sri Lanka':'LK',
    'Cuba':'CU','Cabo Verde':'CV','Namibia':'NA','Mali':'ML','Slovakia':'SK',
    'South Sudan':'SS','Slovenia':'SI','Lithuania':'LT','Estonia':'EE','Mozambique':'MZ',
    'Rwanda':'RW','Suriname':'SR','Guinea-Bissau':'GW','Benin':'BJ','Iceland':'IS',
    'Sierra Leone':'SL','Yemen':'YE','Tunisia':'TN','New Zealand':'NZ','Angola':'AO',
    'Uruguay':'UY','Latvia':'LV','Jordan':'JO','Liberia':'LR','Uganda':'UG',
    'Cyprus':'CY','Georgia':'GE','Burkina Faso':'BF','Niger':'NE','Togo':'TG',
    'Syria':'SY','Jamaica':'JM','Malta':'MT','Andorra':'AD','Chad':'TD','Gambia':'GM',
    'Sao Tome and Principe':'ST','Botswana':'BW','Bahamas':'BS','Vietnam':'VN',
    'Lesotho':'LS','San Marino':'SM','Guyana':'GY','Tanzania':'TZ','Taiwan':'TW',
    'Comoros':'KM','Burundi':'BI','Myanmar':'MM','Mauritius':'MU','Mongolia':'MN',
    'Eritrea':'ER','Cambodia':'KH','Trinidad and Tobago':'TT','Papua New Guinea':'PG',
    'Brunei ':'BN','Brunei':'BN','Barbados':'BB','Seychelles':'SC','Monaco':'MC',
    'Bhutan':'BT','Antigua and Barbuda':'AG','Liechtenstein':'LI','Belize':'BZ',
    'Fiji':'FJ','Timor-Leste':'TL','Grenada':'GD','Laos':'LA','Dominica':'DM',
    'Saint Kitts and Nevis':'KN','Vatican City':'VA',
};

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initScrollEffects();
    initBackToTop();
    initDarkMode();
    initPreloader();

    await loadData();
    initControls();
    initTimeRangeButtons();
    initLineChartModeToggle();
    initRadarSelectors();
    initHeroScroll();
    initExploreButton();
});

// ── UI helpers ────────────────────────────────────────────────────────────────
function initNavigation() {
    const toggle = document.getElementById('mobileToggle');
    const menu   = document.getElementById('mobileMenu');
    const links  = document.querySelectorAll('.nav-link');
    const secs   = document.querySelectorAll('section');

    toggle?.addEventListener('click', () => {
        menu.classList.toggle('active');
        toggle.innerHTML = menu.classList.contains('active')
            ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
    document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => {
        menu?.classList.remove('active');
        if (toggle) toggle.innerHTML = '<i class="fas fa-bars"></i>';
    }));
    window.addEventListener('scroll', () => {
        let cur = '';
        secs.forEach(s => { if (pageYOffset >= s.offsetTop - 120) cur = s.id; });
        links.forEach(l => {
            l.classList.remove('active');
            const h = l.getAttribute('href');
            if (h === `#${cur}` || (cur === 'dashboard' && h === '#home')) l.classList.add('active');
        });
    });
}

function initScrollEffects() {
    const nav = document.querySelector('.navbar');
    window.addEventListener('scroll', () => nav?.classList.toggle('scrolled', window.scrollY > 50));
}

function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initDarkMode() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    toggle.addEventListener('click', () => {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (dark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            toggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            toggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        // Re-render so SVG picks up new CSS variables
        setTimeout(renderAllVisualizations, 50);
    });
}

function initPreloader() {
    const pre = document.querySelector('.preloader');
    if (!pre) return;
    window.addEventListener('load', () => {
        setTimeout(() => {
            pre.classList.add('fade-out');
            setTimeout(() => pre.style.display = 'none', 500);
        }, 1200);
    });
}

function initHeroScroll() {
    document.querySelector('.hero-scroll')?.addEventListener('click', () =>
        document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' }));
}

function initExploreButton() {
    document.getElementById('exploreBtn')?.addEventListener('click', () =>
        document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' }));
    document.getElementById('watchDemoBtn')?.addEventListener('click', () =>
        document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' }));
}

// ── Data Loading ──────────────────────────────────────────────────────────────
async function loadData() {
    showLoadingStates();
    try {
        const [worldometerRaw, dayWiseRaw, countryWiseRaw] = await Promise.all([
            d3.csv('data/worldometer_data.csv'),
            d3.csv('data/day_wise.csv'),
            d3.csv('data/country_wise_latest.csv'),
        ]);

        // Week-change lookup from country_wise_latest
        const wcMap = new Map();
        countryWiseRaw.forEach(r => {
            wcMap.set(r['Country/Region'], {
                weekChange:    +r['1 week change']    || 0,
                weekPct:       +r['1 week % increase'] || 0,
                newCases:      +r['New cases']         || 0,
                newDeaths:     +r['New deaths']        || 0,
                newRecovered:  +r['New recovered']     || 0,
            });
        });

        // Build globalData from worldometer
        globalData = worldometerRaw
            .filter(r => +r['TotalCases'] > 0 && r['Country/Region'] !== 'Diamond Princess')
            .map(r => {
                const name = r['Country/Region'];
                const wc   = wcMap.get(name) || {};
                return {
                    country:         name,
                    country_code:    countryNameToISO2[name.trim()] || '',
                    continent:       r['Continent'] || 'Other',
                    population:      +r['Population']          || 1,
                    confirmed:       +r['TotalCases']          || 0,
                    deaths:          +r['TotalDeaths']         || 0,
                    recovered:       +r['TotalRecovered']      || 0,
                    active:          +r['ActiveCases']         || 0,
                    critical:        +r['Serious,Critical']    || 0,
                    casesPerMillion: +r['Tot Cases/1M pop']    || 0,
                    deathsPerMillion:+r['Deaths/1M pop']       || 0,
                    totalTests:      +r['TotalTests']          || 0,
                    testsPerMillion: +r['Tests/1M pop']        || 0,
                    newCases:        +r['NewCases']  || wc.newCases  || 0,
                    newDeaths:       +r['NewDeaths'] || wc.newDeaths || 0,
                    weekChange:      wc.weekChange   || 0,
                    weekPct:         wc.weekPct      || 0,
                };
            });

        // Build timeSeriesData from day_wise
        timeSeriesData = dayWiseRaw.map(r => ({
            date:         r['Date'],
            cases:        +r['Confirmed']     || 0,
            deaths:       +r['Deaths']        || 0,
            recovered:    +r['Recovered']     || 0,
            active:       +r['Active']        || 0,
            newCases:     +r['New cases']     || 0,
            newDeaths:    +r['New deaths']    || 0,
            newRecovered: +r['New recovered'] || 0,
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        finishDataLoad();
    } catch (err) {
        console.error('CSV load failed:', err);
        showErrorState(err.message);
    }
}

function finishDataLoad() {
    updateHeroStats(globalData);
    updateStatsGrid(globalData);
    updateAnalyticsStats(globalData);
    renderAllVisualizations();
    hideLoadingStates();
    console.log(`✅ Loaded ${globalData.length} countries, ${timeSeriesData.length} daily records`);
}

function showErrorState(msg) {
    hideLoadingStates();
    document.querySelectorAll('.map-container,.bar-container,.pie-container,.line-container,.bubble-container,.hbar-container,.treemap-container,.radar-container')
        .forEach(el => {
            el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--danger);flex-direction:column;gap:8px">
                <i class="fas fa-exclamation-triangle" style="font-size:32px"></i>
                <p>Failed to load data: ${msg}</p></div>`;
        });
}

// ── Stats Updates ─────────────────────────────────────────────────────────────
function getFilteredData() {
    const region = document.getElementById('regionSelect')?.value || 'all';
    if (region === 'all') return globalData;
    const map = {
        asia:     ['asia'],
        europe:   ['europe'],
        americas: ['north america', 'south america', 'americas'],
        africa:   ['africa'],
        oceania:  ['oceania', 'australia-oceania'],
    };
    const allowed = map[region] || [region];
    return globalData.filter(d => d.continent && allowed.includes(d.continent.toLowerCase()));
}

function updateHeroStats(data) {
    const cases     = data.reduce((s, d) => s + d.confirmed, 0);
    const deaths    = data.reduce((s, d) => s + d.deaths,    0);
    const recovered = data.reduce((s, d) => s + d.recovered, 0);
    const rate      = cases > 0 ? (recovered / cases * 100).toFixed(1) : '0';

    animateNumber('heroTotalCases',  cases);
    animateNumber('heroTotalDeaths', deaths);
    const rEl = document.getElementById('heroRecoveryRate');
    if (rEl) rEl.textContent = `${rate}%`;
    const aEl = document.getElementById('heroAffected');
    if (aEl) aEl.textContent = data.length;
}

function updateStatsGrid(data) {
    const cases     = data.reduce((s, d) => s + d.confirmed, 0);
    const deaths    = data.reduce((s, d) => s + d.deaths,    0);
    const recovered = data.reduce((s, d) => s + d.recovered, 0);
    const active    = data.reduce((s, d) => s + (d.active || Math.max(0, d.confirmed - d.deaths - d.recovered)), 0);
    const fatality  = cases > 0 ? (deaths / cases * 100).toFixed(2) : '0.00';

    animateNumber('statTotalCases',     cases);
    animateNumber('statTotalDeaths',    deaths);
    animateNumber('statTotalRecovered', recovered);
    animateNumber('statActiveCases',    active);
    setText('statFatalityRate',       `${fatality}%`);
    setText('statAffectedCountries',  `${data.length}`);

    // Use real week-change data from country_wise_latest
    const totalNewCases  = data.reduce((s, d) => s + (d.newCases  || 0), 0);
    const totalNewDeaths = data.reduce((s, d) => s + (d.newDeaths || 0), 0);
    const weekChangeTot  = data.reduce((s, d) => s + (d.weekChange || 0), 0);

    setText('casesTrend',     `<i class="fas fa-arrow-up"></i> +${formatNumber(totalNewCases)} today`);
    setText('deathsTrend',    `<i class="fas fa-skull-crossbones"></i> +${formatNumber(totalNewDeaths)} today`);
    setText('recoveredTrend', `<i class="fas fa-arrow-up"></i> +${formatNumber(weekChangeTot)} this week`);
}

function setText(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function updateAnalyticsStats(data) {
    if (!data.length) return;

    const caseVals = data.map(d => d.confirmed).sort((a, b) => a - b);
    const mean     = caseVals.reduce((a, b) => a + b, 0) / caseVals.length;
    const median   = caseVals[Math.floor(caseVals.length / 2)];
    const std      = Math.sqrt(caseVals.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / caseVals.length);
    const total    = caseVals.reduce((a, b) => a + b, 0);

    // Total tests across all countries
    const totalTests    = data.reduce((s, d) => s + (d.totalTests || 0), 0);
    const avgCasesPM    = data.filter(d => d.casesPerMillion > 0)
                              .reduce((s, d, _, a) => s + d.casesPerMillion / a.length, 0);
    const highestCPM    = [...data].sort((a, b) => b.casesPerMillion - a.casesPerMillion)[0];

    // Correlation deaths vs confirmed (Pearson)
    const n    = data.length;
    const xm   = data.reduce((s, d) => s + d.confirmed, 0) / n;
    const ym   = data.reduce((s, d) => s + d.deaths,    0) / n;
    const num  = data.reduce((s, d) => s + (d.confirmed - xm) * (d.deaths - ym), 0);
    const den  = Math.sqrt(data.reduce((s, d) => s + Math.pow(d.confirmed - xm, 2), 0) *
                           data.reduce((s, d) => s + Math.pow(d.deaths - ym, 2), 0));
    const corrDeaths = den > 0 ? (num / den).toFixed(2) : 'N/A';

    setText('meanCases',      formatNumber(Math.floor(mean)));
    setText('medianCases',    formatNumber(median));
    setText('stdDevCases',    formatNumber(Math.floor(std)));
    setText('sumCases',       formatNumber(total));
    setText('growthRate',     `<span>${formatNumber(Math.round(avgCasesPM))} avg / million</span>`);
    setText('highestGrowth',  highestCPM ? `${highestCPM.country} (${formatNumber(highestCPM.casesPerMillion)}/M)` : '--');
    setText('doublingTime',   formatNumber(totalTests) + ' tests');
    setText('corrPopulation', `<span>${(data.filter(d => d.totalTests > 0).length / data.length * 100).toFixed(0)}% tested</span>`);
    setText('corrDeaths',     `<span>${corrDeaths}</span>`);
}

function animateNumber(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const dur = 1500, t0 = performance.now();
    (function tick(now) {
        const t = Math.min((now - t0) / dur, 1);
        el.textContent = formatNumber(Math.floor(target * t * (2 - t)));
        if (t < 1) requestAnimationFrame(tick);
    })(t0);
}

// ── Visualizations ────────────────────────────────────────────────────────────
function renderAllVisualizations() {
    const metric  = document.getElementById('metricSelect')?.value || 'confirmed';
    const fd      = getFilteredData();
    const range   = document.querySelector('.time-btn.active')?.dataset.range || 'all';

    renderChoroplethMap(fd, metric);
    renderBarChart(fd, metric, currentTopN);
    renderPieChart(fd);
    renderLineChart(timeSeriesData, range, lineChartMode);
    renderBubbleChart(fd);
    renderHorizontalBarChart(fd);
    renderTreemapChart(fd);
    renderContinentOutcomeChart(fd);

    const c1 = document.getElementById('radarCountry1')?.value || '';
    const c2 = document.getElementById('radarCountry2')?.value || '';
    renderRadarChart(globalData, c1, c2);

    updateStatsGrid(fd);
}

// ── Controls ──────────────────────────────────────────────────────────────────
function initControls() {
    document.getElementById('metricSelect')?.addEventListener('change', e => {
        currentMetric = e.target.value;
        renderAllVisualizations();
    });
    document.getElementById('regionSelect')?.addEventListener('change', renderAllVisualizations);
    document.getElementById('animationSelect')?.addEventListener('change', e => {
        isAnimating = e.target.value === 'true';
        renderAllVisualizations();
    });
    document.getElementById('topNSelect')?.addEventListener('change', e => {
        currentTopN = +e.target.value || 10;
        renderAllVisualizations();
    });
    document.getElementById('exportBtn')?.addEventListener('click', exportDataToCSV);
}

function initTimeRangeButtons() {
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderLineChart(timeSeriesData, btn.dataset.range, lineChartMode);
        });
    });
}

function initLineChartModeToggle() {
    document.querySelectorAll('.line-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.line-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            lineChartMode = btn.dataset.mode;
            const range = document.querySelector('.time-btn.active')?.dataset.range || 'all';
            renderLineChart(timeSeriesData, range, lineChartMode);
        });
    });
}

function initRadarSelectors() {
    const s1 = document.getElementById('radarCountry1');
    const s2 = document.getElementById('radarCountry2');
    if (!s1 || !s2) return;

    const sorted = [...globalData].sort((a, b) => a.country.localeCompare(b.country));
    const opts   = sorted.map(c => `<option value="${c.country}">${c.country}</option>`).join('');
    s1.innerHTML = '<option value="">— Select Country 1 —</option>' + opts;
    s2.innerHTML = '<option value="">— Select Country 2 —</option>' + opts;

    const defs = ['USA', 'India'];
    s1.value = sorted.find(c => c.country === defs[0])?.country || '';
    s2.value = sorted.find(c => c.country === defs[1])?.country || '';

    const onChange = () => renderRadarChart(globalData, s1.value, s2.value);
    s1.addEventListener('change', onChange);
    s2.addEventListener('change', onChange);
    renderRadarChart(globalData, s1.value, s2.value);
}

// ── Export ────────────────────────────────────────────────────────────────────
function exportDataToCSV() {
    const headers = ['Country','Continent','Confirmed','Deaths','Recovered','Active','Critical',
                     'Cases/Million','Deaths/Million','Total Tests','Tests/Million','Fatality Rate'];
    const rows = globalData.map(d => [
        d.country, d.continent || 'Unknown',
        d.confirmed, d.deaths, d.recovered,
        d.active, d.critical,
        d.casesPerMillion, d.deathsPerMillion,
        d.totalTests, d.testsPerMillion,
        ((d.deaths / d.confirmed) * 100).toFixed(2) + '%',
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), {
        href: url,
        download: `covid_data_${new Date().toISOString().split('T')[0]}.csv`
    }).click();
    URL.revokeObjectURL(url);
}

// ── Loading States ────────────────────────────────────────────────────────────
function showLoadingStates() {
    ['.map-container','.bar-container','.pie-container','.line-container',
     '.bubble-container','.hbar-container','.treemap-container','.radar-container']
        .forEach(sel => {
            const el = document.querySelector(sel);
            if (el && !el.querySelector('.loading'))
                el.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Loading data…</p></div>';
        });
}

function hideLoadingStates() {
    document.querySelectorAll('.loading').forEach(el => el.remove());
}

// ── Resize ────────────────────────────────────────────────────────────────────
let _resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(renderAllVisualizations, 250);
});
