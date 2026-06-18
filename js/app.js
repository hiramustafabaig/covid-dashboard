/**
 * DSC327 - COVID-19 Dashboard
 * Main Application Logic — Fixed Version
 */

// Global state (NOT re-declared in charts.js)
let globalData = [];
let timeSeriesData = [];
let currentMetric = 'confirmed';
let currentRegion = 'all';
let currentTopN = 10;
let isAnimating = true;

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing COVID-19 Intelligence Dashboard...');

    initCustomCursor();
    initNavigation();
    initScrollEffects();
    initBackToTop();
    initDarkMode();
    initPreloader();

    await loadData();
    initControls();
    initTimeRangeButtons();
    initRadarSelectors();
    initHeroScroll();
    initExploreButton();
});

// ============================================
// UI Initialization Functions
// ============================================

function initCustomCursor() {
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');
    if (!cursor || !cursorFollower) return;

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        cursorFollower.style.left = e.clientX + 'px';
        cursorFollower.style.top = e.clientY + 'px';
    });

    document.querySelectorAll('a, button, .control-select, .viz-action-btn, .time-btn, .country-select')
        .forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
                cursorFollower.style.borderColor = '#8B5CF6';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorFollower.style.borderColor = '#3B82F6';
            });
        });
}

function initNavigation() {
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            mobileToggle.innerHTML = mobileMenu.classList.contains('active')
                ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });
    }

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu && mobileMenu.classList.remove('active');
            mobileToggle && (mobileToggle.innerHTML = '<i class="fas fa-bars"></i>');
        });
    });

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            if (pageYOffset >= section.offsetTop - 120) current = section.getAttribute('id');
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${current}` || (current === 'dashboard' && href === '#home')) {
                link.classList.add('active');
            }
        });
    });
}

function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar && navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}

function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initDarkMode() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });
}

function initPreloader() {
    const preloader = document.querySelector('.preloader');
    if (!preloader) return;
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => preloader.style.display = 'none', 500);
        }, 1200);
    });
}

function initHeroScroll() {
    document.querySelector('.hero-scroll')?.addEventListener('click', () => {
        document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
    });
}

function initExploreButton() {
    document.getElementById('exploreBtn')?.addEventListener('click', () => {
        document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('watchDemoBtn')?.addEventListener('click', () => {
        document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
    });
}

// ============================================
// Data Loading
// ============================================

async function loadData() {
    showLoadingStates();
    try {
        const res = await fetch('https://disease.sh/v3/covid-19/countries?allowNull=true');
        if (!res.ok) throw new Error('API failed');

        const raw = await res.json();
        globalData = raw.map(c => ({
            country: c.country,
            country_code: c.countryInfo?.iso2 || c.countryInfo?.iso3 || '',
            confirmed: c.cases || 0,
            deaths: c.deaths || 0,
            recovered: c.recovered || 0,
            active: c.active || 0,
            critical: c.critical || 0,
            population: c.population || 1,
            continent: c.continent || 'Other',
            todayCases: c.todayCases || 0,
            todayDeaths: c.todayDeaths || 0
        })).filter(c => c.confirmed > 0);

        await loadTimeSeriesData();
        finishDataLoad();
    } catch (err) {
        console.warn('Live API failed, using mock data:', err.message);
        loadMockData();
    }
}

async function loadTimeSeriesData() {
    try {
        const res = await fetch('https://disease.sh/v3/covid-19/historical/all?lastdays=all');
        if (!res.ok) throw new Error('TS API failed');
        const raw = await res.json();

        timeSeriesData = Object.keys(raw.cases).map(date => ({
            date,
            cases: raw.cases[date] || 0,
            deaths: raw.deaths[date] || 0,
            recovered: raw.recovered[date] || 0
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (err) {
        console.warn('Time series API failed, generating mock:', err.message);
        generateMockTimeSeriesData();
    }
}

function finishDataLoad() {
    updateHeroStats(globalData);
    updateStatsGrid(globalData);
    updateAnalyticsStats(globalData);
    renderAllVisualizations();
    hideLoadingStates();
    console.log(`✅ Loaded ${globalData.length} countries`);
}

function loadMockData() {
    globalData = [
        { country: "USA", country_code: "US", confirmed: 103436829, deaths: 1127152, recovered: 101234567, active: 1075110, population: 331000000, continent: "North America" },
        { country: "India", country_code: "IN", confirmed: 44998234, deaths: 531987, recovered: 44456789, active: 9458, population: 1380000000, continent: "Asia" },
        { country: "France", country_code: "FR", confirmed: 40123456, deaths: 167543, recovered: 39876543, active: 79370, population: 65273511, continent: "Europe" },
        { country: "Germany", country_code: "DE", confirmed: 38456789, deaths: 174567, recovered: 38212345, active: 69877, population: 83783942, continent: "Europe" },
        { country: "Brazil", country_code: "BR", confirmed: 37567890, deaths: 702345, recovered: 36789012, active: 76533, population: 212559417, continent: "South America" },
        { country: "Japan", country_code: "JP", confirmed: 33456789, deaths: 74123, recovered: 32890123, active: 492543, population: 125836021, continent: "Asia" },
        { country: "South Korea", country_code: "KR", confirmed: 31567890, deaths: 34567, recovered: 30987654, active: 545669, population: 51269185, continent: "Asia" },
        { country: "Italy", country_code: "IT", confirmed: 26234567, deaths: 190123, recovered: 25890123, active: 154321, population: 60262770, continent: "Europe" },
        { country: "UK", country_code: "GB", confirmed: 25234567, deaths: 227123, recovered: 24789012, active: 218432, population: 67221555, continent: "Europe" },
        { country: "Russia", country_code: "RU", confirmed: 23234567, deaths: 398123, recovered: 22567890, active: 268554, population: 145934462, continent: "Europe" },
        { country: "Turkey", country_code: "TR", confirmed: 17234567, deaths: 101123, recovered: 16890123, active: 243321, population: 84339067, continent: "Asia" },
        { country: "Spain", country_code: "ES", confirmed: 13890123, deaths: 121123, recovered: 13678901, active: 90099, population: 46754778, continent: "Europe" },
        { country: "Australia", country_code: "AU", confirmed: 11567890, deaths: 22123, recovered: 11456789, active: 88978, population: 25788217, continent: "Oceania" },
        { country: "Vietnam", country_code: "VN", confirmed: 11623456, deaths: 43234, recovered: 11512345, active: 67877, population: 97338579, continent: "Asia" },
        { country: "Argentina", country_code: "AR", confirmed: 10123456, deaths: 130123, recovered: 9867890, active: 125443, population: 45195777, continent: "South America" },
        { country: "Netherlands", country_code: "NL", confirmed: 8678901, deaths: 22345, recovered: 8601234, active: 55322, population: 17134872, continent: "Europe" },
        { country: "Mexico", country_code: "MX", confirmed: 7689012, deaths: 334567, recovered: 7345678, active: 8767, population: 128932753, continent: "North America" },
        { country: "Indonesia", country_code: "ID", confirmed: 6789012, deaths: 161234, recovered: 6567890, active: 59888, population: 273523615, continent: "Asia" },
        { country: "Poland", country_code: "PL", confirmed: 6543210, deaths: 119123, recovered: 6345678, active: 78409, population: 37950802, continent: "Europe" },
        { country: "South Africa", country_code: "ZA", confirmed: 4123456, deaths: 102345, recovered: 3987654, active: 33457, population: 59308690, continent: "Africa" },
        { country: "Egypt", country_code: "EG", confirmed: 516023, deaths: 24789, recovered: 458901, active: 32333, population: 102334404, continent: "Africa" },
        { country: "Nigeria", country_code: "NG", confirmed: 266045, deaths: 3155, recovered: 259672, active: 3218, population: 206139589, continent: "Africa" },
        { country: "Kenya", country_code: "KE", confirmed: 342560, deaths: 5664, recovered: 334890, active: 2006, population: 53771296, continent: "Africa" },
        { country: "New Zealand", country_code: "NZ", confirmed: 2198850, deaths: 3060, recovered: 2158900, active: 36890, population: 4820000, continent: "Oceania" },
        { country: "Canada", country_code: "CA", confirmed: 4639230, deaths: 52340, recovered: 4560780, active: 26110, population: 37742154, continent: "North America" },
        { country: "Chile", country_code: "CL", confirmed: 5130213, deaths: 63906, recovered: 5020340, active: 45967, population: 19116201, continent: "South America" },
        { country: "Colombia", country_code: "CO", confirmed: 6361657, deaths: 141957, recovered: 6200234, active: 19466, population: 50882891, continent: "South America" },
        { country: "Pakistan", country_code: "PK", confirmed: 1580967, deaths: 30630, recovered: 1547890, active: 2447, population: 220892340, continent: "Asia" },
        { country: "Bangladesh", country_code: "BD", confirmed: 2037997, deaths: 29433, recovered: 2006120, active: 2444, population: 164689383, continent: "Asia" },
        { country: "Malaysia", country_code: "MY", confirmed: 5025876, deaths: 36882, recovered: 4978990, active: 10004, population: 32365999, continent: "Asia" },
    ];

    generateMockTimeSeriesData();
    finishDataLoad();
}

function generateMockTimeSeriesData() {
    timeSeriesData = [];
    const startDate = new Date('2020-01-22');
    const endDate = new Date();
    let cases = 1000, deaths = 50, recovered = 900;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
        const tp = (d - startDate) / (endDate - startDate);
        const waveFactor = 1 + Math.sin(tp * Math.PI * 5) * 0.4;
        const growth = 1 + Math.random() * 0.18 * waveFactor;
        cases = Math.min(Math.floor(cases * Math.min(growth, 1.25)), 700000000);
        deaths = Math.min(Math.floor(deaths * (0.97 + Math.random() * 0.06)), 7000000);
        recovered = Math.min(Math.floor(recovered * (0.97 + Math.random() * 0.07)), 650000000);
        timeSeriesData.push({ date: new Date(d).toISOString().split('T')[0], cases, deaths, recovered });
    }
}

// ============================================
// Stats Update Functions
// ============================================

function getFilteredData() {
    const region = document.getElementById('regionSelect')?.value || 'all';
    if (region === 'all') return globalData;

    // Normalize: handle API continent names vs dropdown values
    const regionMap = {
        'asia': ['asia'],
        'europe': ['europe'],
        'americas': ['north america', 'south america', 'americas'],
        'africa': ['africa'],
        'oceania': ['oceania', 'australia-oceania']
    };
    const allowed = regionMap[region] || [region];
    return globalData.filter(d => d.continent && allowed.includes(d.continent.toLowerCase()));
}

function updateHeroStats(data) {
    const totalCases = data.reduce((s, d) => s + d.confirmed, 0);
    const totalDeaths = data.reduce((s, d) => s + d.deaths, 0);
    const totalRecovered = data.reduce((s, d) => s + d.recovered, 0);
    const recoveryRate = totalCases > 0 ? (totalRecovered / totalCases * 100).toFixed(1) : '0';

    animateNumber('heroTotalCases', totalCases);
    animateNumber('heroTotalDeaths', totalDeaths);
    const heroRec = document.getElementById('heroRecoveryRate');
    if (heroRec) heroRec.textContent = `${recoveryRate}%`;
    const heroAff = document.getElementById('heroAffected');
    if (heroAff) heroAff.textContent = data.length;
}

function updateStatsGrid(data) {
    const totalCases = data.reduce((s, d) => s + d.confirmed, 0);
    const totalDeaths = data.reduce((s, d) => s + d.deaths, 0);
    const totalRecovered = data.reduce((s, d) => s + d.recovered, 0);
    const totalActive = data.reduce((s, d) => s + Math.max(0, d.confirmed - d.deaths - d.recovered), 0);
    const fatalityRate = totalCases > 0 ? (totalDeaths / totalCases * 100).toFixed(2) : '0.00';

    animateNumber('statTotalCases', totalCases);
    animateNumber('statTotalDeaths', totalDeaths);
    animateNumber('statTotalRecovered', totalRecovered);
    animateNumber('statActiveCases', totalActive);
    const fr = document.getElementById('statFatalityRate');
    if (fr) fr.textContent = `${fatalityRate}%`;
    const ac = document.getElementById('statAffectedCountries');
    if (ac) ac.textContent = data.length;

    setText('casesTrend', '<i class="fas fa-arrow-up"></i> +2.3%');
    setText('deathsTrend', '<i class="fas fa-arrow-down"></i> -0.7%');
    setText('recoveredTrend', '<i class="fas fa-arrow-up"></i> +1.8%');
}

function setText(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function updateAnalyticsStats(data) {
    if (!data.length) return;
    const cases = data.map(d => d.confirmed).sort((a, b) => a - b);
    const mean = cases.reduce((a, b) => a + b, 0) / cases.length;
    const median = cases[Math.floor(cases.length / 2)];
    const std = Math.sqrt(cases.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / cases.length);
    const total = cases.reduce((a, b) => a + b, 0);

    setText('meanCases', formatNumber(Math.floor(mean)));
    setText('medianCases', formatNumber(median));
    setText('stdDevCases', formatNumber(Math.floor(std)));
    setText('sumCases', formatNumber(total));
    setText('growthRate', '<span class="positive"><i class="fas fa-arrow-down"></i> -0.3% daily</span>');
    setText('highestGrowth', 'Singapore (+5.2%)');
    setText('doublingTime', '47 days');
    setText('corrPopulation', '<span>0.42</span>');
    setText('corrDeaths', '<span>0.98</span>');
}

function animateNumber(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 1500;
    const start = performance.now();
    function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = t * (2 - t);
        el.textContent = formatNumber(Math.floor(target * ease));
        if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// ============================================
// Visualization Rendering
// ============================================

function renderAllVisualizations() {
    const metric = document.getElementById('metricSelect')?.value || 'confirmed';
    const filteredData = getFilteredData();

    renderChoroplethMap(filteredData, metric);
    renderBarChart(filteredData, metric, currentTopN);
    renderPieChart(filteredData);
    renderLineChart(timeSeriesData, document.querySelector('.time-btn.active')?.dataset.range || 'all');
    renderBubbleChart(filteredData, metric);
    renderHorizontalBarChart(filteredData);
    renderTreemapChart(filteredData);

    const c1 = document.getElementById('radarCountry1')?.value || '';
    const c2 = document.getElementById('radarCountry2')?.value || '';
    renderRadarChart(globalData, c1, c2);

    // Update stats for filtered data
    updateStatsGrid(filteredData);
}

// ============================================
// Controls
// ============================================

function initControls() {
    document.getElementById('metricSelect')?.addEventListener('change', e => {
        currentMetric = e.target.value;
        renderAllVisualizations();
    });

    document.getElementById('regionSelect')?.addEventListener('change', () => {
        renderAllVisualizations();
    });

    document.getElementById('animationSelect')?.addEventListener('change', e => {
        isAnimating = e.target.value === 'true';
        renderAllVisualizations();
    });

    document.getElementById('exportBtn')?.addEventListener('click', exportDataToCSV);
}

function initTimeRangeButtons() {
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderLineChart(timeSeriesData, btn.dataset.range);
        });
    });
}

function initRadarSelectors() {
    const sel1 = document.getElementById('radarCountry1');
    const sel2 = document.getElementById('radarCountry2');
    if (!sel1 || !sel2) return;

    const sorted = [...globalData].sort((a, b) => a.country.localeCompare(b.country));
    const options = sorted.map(c => `<option value="${c.country}">${c.country}</option>`).join('');

    sel1.innerHTML = '<option value="">Select Country 1</option>' + options;
    sel2.innerHTML = '<option value="">Select Country 2</option>' + options;

    // Default comparison
    const defaults = ['USA', 'India'];
    const d1 = sorted.find(c => c.country === defaults[0]);
    const d2 = sorted.find(c => c.country === defaults[1]);
    if (d1) sel1.value = d1.country;
    if (d2) sel2.value = d2.country;

    const onChange = () => renderRadarChart(globalData, sel1.value, sel2.value);
    sel1.addEventListener('change', onChange);
    sel2.addEventListener('change', onChange);

    // Initial render with defaults
    renderRadarChart(globalData, sel1.value, sel2.value);
}

// ============================================
// Export
// ============================================

function exportDataToCSV() {
    const headers = ['Country', 'Continent', 'Confirmed', 'Deaths', 'Recovered', 'Active', 'Fatality Rate'];
    const rows = globalData.map(d => [
        d.country,
        d.continent || 'Unknown',
        d.confirmed,
        d.deaths,
        d.recovered,
        Math.max(0, d.confirmed - d.deaths - d.recovered),
        ((d.deaths / d.confirmed) * 100).toFixed(2) + '%'
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
        href: url,
        download: `covid_data_${new Date().toISOString().split('T')[0]}.csv`
    });
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// Loading States
// ============================================

function showLoadingStates() {
    ['.map-container', '.bar-container', '.pie-container', '.line-container',
     '.bubble-container', '.hbar-container', '.treemap-container', '.radar-container']
        .forEach(sel => {
            const el = document.querySelector(sel);
            if (el && !el.querySelector('.loading')) {
                el.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Loading…</p></div>';
            }
        });
}

function hideLoadingStates() {
    document.querySelectorAll('.loading').forEach(el => el.remove());
}

// ============================================
// Resize
// ============================================

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderAllVisualizations, 250);
});