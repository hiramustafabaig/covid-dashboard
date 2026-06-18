/**
 * DSC327 - COVID-19 Dashboard
 * D3.js Visualizations — powered by real Kaggle dataset
 */

// ── Color helpers ─────────────────────────────────────────────────────────────
const colorScale = d3.scaleSequentialLog()
    .domain([100, 5000000])
    .interpolator(d3.interpolateViridis);

const fatalityColorScale = d3.scaleLinear()
    .domain([0, 0.02, 0.05, 0.10, 0.15])
    .range(['#10B981','#34D399','#F59E0B','#F97316','#EF4444']);

const regionColors = {
    'Asia':          '#3B82F6',
    'Europe':        '#8B5CF6',
    'North America': '#10B981',
    'South America': '#06B6D4',
    'Americas':      '#10B981',
    'Africa':        '#F59E0B',
    'Oceania':       '#EC4899',
    'Other':         '#94A3B8',
};

function getTooltip() {
    let t = d3.select('.tooltip');
    if (t.empty()) t = d3.select('body').append('div').attr('class','tooltip');
    return t;
}

function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ── Metric display labels ─────────────────────────────────────────────────────
const metricLabel = {
    confirmed:        'Total Cases',
    deaths:           'Total Deaths',
    recovered:        'Total Recovered',
    active:           'Active Cases',
    critical:         'Critical Cases',
    casesPerMillion:  'Cases per Million',
    deathsPerMillion: 'Deaths per Million',
    totalTests:       'Total Tests',
    testsPerMillion:  'Tests per Million',
};

// ── 1. Choropleth Map ─────────────────────────────────────────────────────────
async function renderChoroplethMap(data, metric = 'confirmed') {
    const container = document.getElementById('choroplethMap');
    if (!container) return;

    const width  = container.clientWidth || 800;
    const height = 450;

    d3.select('#choroplethMap').selectAll('*').remove();

    const svg = d3.select('#choroplethMap').append('svg')
        .attr('width', width).attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('background','transparent');

    const projection = d3.geoMercator()
        .scale(width / 6.5)
        .translate([width / 2, height / 1.7]);

    const path = d3.geoPath().projection(projection);

    const byCode = new Map();
    const byName = new Map();
    data.forEach(d => {
        if (d.country_code) byCode.set(d.country_code.toUpperCase(), d);
        if (d.country)      byName.set(d.country.toLowerCase(), d);
    });

    const numericToISO2 = {
        4:'AF',8:'AL',12:'DZ',20:'AD',24:'AO',32:'AR',36:'AU',40:'AT',50:'BD',56:'BE',
        64:'BT',68:'BO',76:'BR',100:'BG',116:'KH',120:'CM',124:'CA',144:'LK',152:'CL',
        156:'CN',170:'CO',178:'CG',180:'CD',188:'CR',191:'HR',192:'CU',196:'CY',203:'CZ',
        208:'DK',218:'EC',818:'EG',222:'SV',233:'EE',231:'ET',246:'FI',250:'FR',266:'GA',
        276:'DE',288:'GH',300:'GR',320:'GT',332:'HT',340:'HN',348:'HU',356:'IN',360:'ID',
        364:'IR',368:'IQ',372:'IE',376:'IL',380:'IT',384:'CI',388:'JM',392:'JP',400:'JO',
        398:'KZ',404:'KE',410:'KR',408:'KP',414:'KW',418:'LA',422:'LB',426:'LS',430:'LR',
        434:'LY',440:'LT',442:'LU',450:'MG',458:'MY',484:'MX',496:'MN',504:'MA',508:'MZ',
        516:'NA',524:'NP',528:'NL',554:'NZ',558:'NI',566:'NG',578:'NO',586:'PK',591:'PA',
        598:'PG',600:'PY',604:'PE',608:'PH',616:'PL',620:'PT',630:'PR',634:'QA',642:'RO',
        643:'RU',646:'RW',682:'SA',686:'SN',694:'SL',703:'SK',705:'SI',706:'SO',710:'ZA',
        724:'ES',729:'SD',752:'SE',756:'CH',760:'SY',762:'TJ',764:'TH',626:'TL',768:'TG',
        780:'TT',788:'TN',792:'TR',800:'UG',804:'UA',784:'AE',826:'GB',840:'US',858:'UY',
        860:'UZ',862:'VE',704:'VN',887:'YE',894:'ZM',716:'ZW',
    };

    // dynamic color scale for non-confirmed metrics
    const maxVal = d3.max(data, d => +d[metric] || 0) || 1;
    const dynamicScale = d3.scaleSequentialLog()
        .domain([1, maxVal])
        .interpolator(d3.interpolateViridis);

    try {
        const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json');
        const countries = topojson.feature(world, world.objects.countries);

        const g = svg.append('g');

        g.selectAll('path')
            .data(countries.features)
            .enter().append('path')
            .attr('class','country')
            .attr('d', path)
            .attr('fill', d => {
                const iso2 = numericToISO2[+d.id];
                const cd   = iso2 ? byCode.get(iso2) : null;
                if (cd) {
                    const val = +cd[metric] || 0;
                    if (val > 0) return dynamicScale(val);
                }
                return 'var(--border-color)';
            })
            .attr('stroke','#FFFFFF').attr('stroke-width', 0.5)
            .on('mouseover', function(event, d) {
                const iso2 = numericToISO2[+d.id];
                const cd   = iso2 ? byCode.get(iso2) : null;
                if (cd) {
                    getTooltip().style('opacity',1)
                        .html(`<strong>${cd.country}</strong><br>
                            ${metricLabel[metric]}: ${formatNumber(cd[metric])}<br>
                            Confirmed: ${formatNumber(cd.confirmed)}<br>
                            Deaths: ${formatNumber(cd.deaths)}<br>
                            Cases/Million: ${formatNumber(cd.casesPerMillion)}<br>
                            Fatality Rate: ${cd.confirmed > 0 ? (cd.deaths/cd.confirmed*100).toFixed(2) : '0'}%`)
                        .style('left',(event.pageX+14)+'px')
                        .style('top', (event.pageY-50)+'px');
                    d3.select(this).attr('stroke-width',2).attr('stroke','#3B82F6');
                }
            })
            .on('mouseout', function() {
                getTooltip().style('opacity',0);
                d3.select(this).attr('stroke-width',0.5).attr('stroke','#FFFFFF');
            });

        // Zoom
        const zoom = d3.zoom().scaleExtent([1,8])
            .on('zoom', e => g.attr('transform', e.transform));
        svg.call(zoom);

        const cloneBtn = id => {
            const el = document.getElementById(id);
            if (!el) return;
            const n = el.cloneNode(true);
            el.parentNode.replaceChild(n, el);
            return n;
        };
        cloneBtn('mapResetBtn')   ?.addEventListener('click', () => svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity));
        cloneBtn('mapZoomInBtn')  ?.addEventListener('click', () => svg.transition().duration(750).call(zoom.scaleBy, 1.5));
        cloneBtn('mapZoomOutBtn') ?.addEventListener('click', () => svg.transition().duration(750).call(zoom.scaleBy, 0.667));

        // Legend
        const lw = 200, lh = 12;
        const lg = svg.append('g').attr('transform',`translate(20,${height-40})`);
        const defs = svg.append('defs');
        const grad = defs.append('linearGradient').attr('id','map-leg-grad');
        grad.selectAll('stop')
            .data([{o:'0%',c:d3.interpolateViridis(0)},{o:'50%',c:d3.interpolateViridis(0.5)},{o:'100%',c:d3.interpolateViridis(1)}])
            .enter().append('stop').attr('offset',d=>d.o).attr('stop-color',d=>d.c);
        lg.append('rect').attr('width',lw).attr('height',lh)
            .style('fill','url(#map-leg-grad)').attr('rx',4);
        lg.append('text').attr('x',0).attr('y',-4).style('font-size','9px').style('fill','var(--text-tertiary)').text('Low');
        lg.append('text').attr('x',lw).attr('y',-4).attr('text-anchor','end').style('font-size','9px').style('fill','var(--text-tertiary)').text('High');
        lg.append('text').attr('x',lw/2).attr('y',lh+12).attr('text-anchor','middle')
            .style('font-size','9px').style('fill','var(--text-tertiary)')
            .text(`Metric: ${metricLabel[metric]}`);

    } catch(err) {
        console.error('Map error:', err);
        showFallbackMap(svg, width, height, data, metric);
    }
}

function showFallbackMap(svg, width, height, data, metric) {
    svg.append('rect').attr('width',width).attr('height',height).attr('fill','var(--bg-secondary)').attr('rx',12);
    svg.append('text').attr('x',width/2).attr('y',30).attr('text-anchor','middle')
        .style('font-size','14px').style('font-weight','600').style('fill','var(--text-secondary)')
        .text(`Top Countries — ${metricLabel[metric] || metric}`);

    const top = [...data].filter(d => (d[metric]||0) > 0)
                          .sort((a,b)=>(b[metric]||0)-(a[metric]||0)).slice(0,15);
    const rScale = d3.scaleSqrt().domain([0, d3.max(top, d=>d[metric]||0)]).range([8,45]);

    top.forEach((d,i) => {
        const col = i % 5, row = Math.floor(i/5);
        const x = 80 + col * ((width-120)/5);
        const y = 70 + row * 120;
        const r = rScale(d[metric]||0);
        svg.append('circle').attr('cx',x).attr('cy',y).attr('r',r)
            .attr('fill', colorScale(Math.max(d.confirmed||0,100))).attr('opacity',0.85)
            .attr('stroke','#fff').attr('stroke-width',2).style('cursor','pointer')
            .on('mouseover', function(event) {
                getTooltip().style('opacity',1)
                    .html(`<strong>${d.country}</strong><br>${metricLabel[metric]||metric}: ${formatNumber(d[metric])}`)
                    .style('left',(event.pageX+10)+'px').style('top',(event.pageY-30)+'px');
            })
            .on('mouseout', () => getTooltip().style('opacity',0));
        svg.append('text').attr('x',x).attr('y',y+r+14).attr('text-anchor','middle')
            .style('fill','var(--text-secondary)').style('font-size','9px')
            .text(d.country.length>10 ? d.country.slice(0,9)+'…' : d.country);
    });
}

// ── 2. Bar Chart ──────────────────────────────────────────────────────────────
function renderBarChart(data, metric = 'confirmed', topN = 10) {
    const container = document.getElementById('barChart');
    if (!container) return;

    const width  = container.clientWidth || 500;
    const height = 420;
    const margin = { top: 20, right: 20, bottom: 130, left: 75 };
    const iw = width  - margin.left - margin.right;
    const ih = height - margin.top  - margin.bottom;

    d3.select('#barChart').selectAll('*').remove();

    const fd = [...data].filter(d => (d[metric]||0) > 0)
                         .sort((a,b)=>(b[metric]||0)-(a[metric]||0))
                         .slice(0, topN);

    if (!fd.length) {
        d3.select('#barChart').append('div').attr('class','loading')
            .html('<p style="color:var(--text-tertiary)">No data for this metric/region</p>');
        return;
    }

    const svg = d3.select('#barChart').append('svg')
        .attr('width',width).attr('height',height)
        .append('g').attr('transform',`translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(fd.map(d=>d.country)).range([0,iw]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(fd,d=>d[metric]||0)]).range([ih,0]).nice();

    const barColor = d3.scaleLinear()
        .domain([0, d3.max(fd,d=>d[metric]||0)])
        .range(['#93C5FD','#1D4ED8']);

    // grid
    svg.append('g').attr('class','grid')
        .call(d3.axisLeft(y).tickSize(-iw).tickFormat(''))
        .selectAll('line').attr('stroke','rgba(148,163,184,0.2)');
    svg.select('.grid .domain').remove();

    // axes
    svg.append('g').attr('class','axis').attr('transform',`translate(0,${ih})`)
        .call(d3.axisBottom(x))
        .selectAll('text').attr('transform','rotate(-45)').style('text-anchor','end').style('font-size','10px');

    svg.append('g').attr('class','axis')
        .call(d3.axisLeft(y).tickFormat(d=>formatNumberShort(d)));

    // y-axis label
    svg.append('text').attr('transform','rotate(-90)').attr('x',-ih/2).attr('y',-60)
        .attr('text-anchor','middle').style('font-size','11px').style('fill','var(--text-tertiary)')
        .text(metricLabel[metric] || metric);

    // bars
    const bars = svg.selectAll('rect.bar').data(fd).enter()
        .append('rect').attr('class','bar')
        .attr('x',d=>x(d.country)).attr('width',x.bandwidth())
        .attr('y',ih).attr('height',0)
        .attr('fill',d=>barColor(d[metric]||0)).attr('rx',5)
        .on('mouseover', function(event,d) {
            getTooltip().style('opacity',1)
                .html(`<strong>${d.country}</strong><br>
                    ${metricLabel[metric]}: ${formatNumber(d[metric])}<br>
                    Deaths: ${formatNumber(d.deaths)}<br>
                    Cases/Million: ${formatNumber(d.casesPerMillion)}<br>
                    Fatality Rate: ${d.confirmed>0 ? (d.deaths/d.confirmed*100).toFixed(2) : '0'}%`)
                .style('left',(event.pageX+10)+'px').style('top',(event.pageY-40)+'px');
            d3.select(this).attr('opacity',0.8);
        })
        .on('mouseout', function() {
            getTooltip().style('opacity',0);
            d3.select(this).attr('opacity',1);
        });

    bars.transition().duration(isAnimating ? 800 : 0)
        .attr('y', d=>y(d[metric]||0))
        .attr('height', d=>ih-y(d[metric]||0));

    // Sort button
    let sortAsc = false;
    const sortBtn = document.getElementById('sortBarBtn');
    if (sortBtn) {
        const nb = sortBtn.cloneNode(true);
        sortBtn.parentNode.replaceChild(nb, sortBtn);
        nb.addEventListener('click', () => {
            sortAsc = !sortAsc;
            const resorted = sortAsc
                ? [...fd].sort((a,b)=>(a[metric]||0)-(b[metric]||0))
                : [...fd].sort((a,b)=>(b[metric]||0)-(a[metric]||0));
            x.domain(resorted.map(d=>d.country));
            svg.select('.axis').call(d3.axisBottom(x))
                .selectAll('text').attr('transform','rotate(-45)').style('text-anchor','end').style('font-size','10px');
            svg.selectAll('rect.bar').data(resorted).transition().duration(600)
                .attr('x',d=>x(d.country));
        });
    }
}

// ── 3. Pie / Donut Chart ──────────────────────────────────────────────────────
function renderPieChart(data) {
    const container = document.getElementById('pieChart');
    if (!container) return;

    const width  = container.clientWidth || 500;
    const height = 420;
    const legendReserve = 165;
    const pieAreaWidth  = width - legendReserve;
    const radius  = Math.min(pieAreaWidth * 0.45, height * 0.44);
    const centerX = pieAreaWidth / 2;

    d3.select('#pieChart').selectAll('*').remove();

    const regionData = {};
    data.forEach(d => {
        const c = d.continent || 'Other';
        regionData[c] = (regionData[c]||0) + (d.confirmed||0);
    });

    const pieData = Object.entries(regionData)
        .filter(([,v])=>v>0)
        .map(([region,value])=>({region,value}))
        .sort((a,b)=>b.value-a.value);

    if (!pieData.length) return;

    const svg = d3.select('#pieChart').append('svg')
        .attr('width',width).attr('height',height)
        .append('g').attr('transform',`translate(${centerX},${height/2})`);

    const pie   = d3.pie().value(d=>d.value).sort(null);
    const arc   = d3.arc().innerRadius(radius*0.45).outerRadius(radius);
    const arcH  = d3.arc().innerRadius(radius*0.45).outerRadius(radius+12);
    const color = d3.scaleOrdinal().domain(Object.keys(regionColors)).range(Object.values(regionColors));
    const total = d3.sum(pieData, d=>d.value);

    svg.selectAll('path').data(pie(pieData)).enter().append('path')
        .attr('d',arc)
        .attr('fill',d=>color(d.data.region))
        .attr('stroke','white').attr('stroke-width',2)
        .style('cursor','pointer')
        .on('mouseover', function(event,d) {
            d3.select(this).transition().duration(150).attr('d',arcH);
            getTooltip().style('opacity',1)
                .html(`<strong>${d.data.region}</strong><br>Cases: ${formatNumber(d.data.value)}<br>Share: ${((d.data.value/total)*100).toFixed(1)}%`)
                .style('left',(event.pageX+10)+'px').style('top',(event.pageY-30)+'px');
        })
        .on('mouseout', function() {
            d3.select(this).transition().duration(150).attr('d',arc);
            getTooltip().style('opacity',0);
        });

    svg.append('text').attr('text-anchor','middle').attr('y',-8)
        .style('font-size','11px').style('fill','var(--text-tertiary)').text('Global');
    svg.append('text').attr('text-anchor','middle').attr('y',10)
        .style('font-size','13px').style('font-weight','700').style('fill','var(--text-primary)')
        .text(formatNumberShort(total));

    const leg = svg.append('g').attr('transform',`translate(${radius+18},${-Math.min(pieData.length*13, radius*0.8)})`);
    pieData.forEach((d,i) => {
        leg.append('rect').attr('x',0).attr('y',i*26).attr('width',12).attr('height',12)
            .attr('fill',color(d.region)).attr('rx',3);
        leg.append('text').attr('x',18).attr('y',i*26+10)
            .style('font-size','10px').style('fill','var(--text-secondary)')
            .text(`${d.region} (${((d.value/total)*100).toFixed(1)}%)`);
    });
}

// ── 4. Line Chart (Cumulative + Daily modes) ──────────────────────────────────
function renderLineChart(data, timeRange = 'all', mode = 'cumulative') {
    const container = document.getElementById('lineChart');
    if (!container || !data || !data.length) return;

    const width  = container.clientWidth || 800;
    const height = 420;
    const margin = { top: 20, right: 100, bottom: 50, left: 80 };
    const iw = width  - margin.left - margin.right;
    const ih = height - margin.top  - margin.bottom;

    d3.select('#lineChart').selectAll('*').remove();

    // Filter time range
    let fd = [...data];
    const now = new Date(data[data.length-1]?.date || new Date());
    if (timeRange === '30d') { const c=new Date(now); c.setDate(c.getDate()-30); fd=data.filter(d=>new Date(d.date)>=c); }
    else if (timeRange === '90d') { const c=new Date(now); c.setDate(c.getDate()-90); fd=data.filter(d=>new Date(d.date)>=c); }
    else if (timeRange === '1y') { const c=new Date(now); c.setFullYear(c.getFullYear()-1); fd=data.filter(d=>new Date(d.date)>=c); }

    if (!fd.length) return;

    const svg = d3.select('#lineChart').append('svg')
        .attr('width',width).attr('height',height)
        .append('g').attr('transform',`translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleTime().domain(d3.extent(fd,d=>new Date(d.date))).range([0,iw]);

    if (mode === 'daily') {
        // ── Daily new cases / deaths / recovered bars + lines ──
        const keys = [
            { key:'newCases',     color:'#3B82F6', label:'New Cases' },
            { key:'newDeaths',    color:'#EF4444', label:'New Deaths' },
            { key:'newRecovered', color:'#10B981', label:'New Recovered' },
        ];
        const yMax = d3.max(fd, d => Math.max(d.newCases||0, d.newDeaths||0, d.newRecovered||0));
        const yScale = d3.scaleLinear().domain([0, yMax]).range([ih,0]).nice();

        svg.append('g').attr('class','grid')
            .call(d3.axisLeft(yScale).tickSize(-iw).tickFormat(''))
            .selectAll('line').attr('stroke','rgba(148,163,184,0.15)');
        svg.select('.grid .domain').remove();

        svg.append('g').attr('class','axis').attr('transform',`translate(0,${ih})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d')).ticks(6));
        svg.append('g').attr('class','axis')
            .call(d3.axisLeft(yScale).tickFormat(d=>formatNumberShort(d)));

        // Area for new cases
        const area = d3.area().defined(d=>d.newCases!=null)
            .x(d=>xScale(new Date(d.date))).y0(ih).y1(d=>yScale(d.newCases||0))
            .curve(d3.curveMonotoneX);
        svg.append('path').datum(fd)
            .attr('fill','rgba(59,130,246,0.12)').attr('d',area);

        keys.forEach(k => {
            const lineGen = d3.line().defined(d=>d[k.key]!=null)
                .x(d=>xScale(new Date(d.date))).y(d=>yScale(d[k.key]||0))
                .curve(d3.curveMonotoneX);
            svg.append('path').datum(fd).attr('fill','none')
                .attr('stroke',k.color).attr('stroke-width',k.key==='newCases'?2.5:1.8)
                .attr('d',lineGen);
        });

        // Axis label
        svg.append('text').attr('transform','rotate(-90)').attr('x',-ih/2).attr('y',-65)
            .attr('text-anchor','middle').style('font-size','11px').style('fill','var(--text-tertiary)')
            .text('Daily Count');

        // Legend
        const leg = svg.append('g').attr('transform',`translate(${iw+10},10)`);
        keys.forEach((k,i) => {
            leg.append('rect').attr('y',i*22).attr('width',12).attr('height',12).attr('fill',k.color).attr('rx',2);
            leg.append('text').attr('x',18).attr('y',i*22+10).style('font-size','10px').style('fill','var(--text-secondary)').text(k.label);
        });

    } else {
        // ── Cumulative cases / deaths / recovered ──
        const keys = [
            { key:'cases',     color:'#3B82F6', label:'Confirmed' },
            { key:'deaths',    color:'#EF4444', label:'Deaths' },
            { key:'recovered', color:'#10B981', label:'Recovered' },
        ];
        const yMax = d3.max(fd, d => Math.max(d.cases||0, d.recovered||0));
        const yScale = d3.scaleLinear().domain([0, yMax]).range([ih,0]).nice();

        svg.append('g').attr('class','grid')
            .call(d3.axisLeft(yScale).tickSize(-iw).tickFormat(''))
            .selectAll('line').attr('stroke','rgba(148,163,184,0.15)');
        svg.select('.grid .domain').remove();

        svg.append('g').attr('class','axis').attr('transform',`translate(0,${ih})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %Y')).ticks(6));
        svg.append('g').attr('class','axis')
            .call(d3.axisLeft(yScale).tickFormat(d=>formatNumberShort(d)));

        const area = d3.area().defined(d=>d.cases!=null)
            .x(d=>xScale(new Date(d.date))).y0(ih).y1(d=>yScale(d.cases||0))
            .curve(d3.curveMonotoneX);
        svg.append('path').datum(fd).attr('fill','rgba(59,130,246,0.07)').attr('d',area);

        keys.forEach((k,li) => {
            const lineGen = d3.line().defined(d=>d[k.key]!=null)
                .x(d=>xScale(new Date(d.date))).y(d=>yScale(d[k.key]||0)).curve(d3.curveMonotoneX);
            const p = svg.append('path').datum(fd).attr('fill','none')
                .attr('stroke',k.color).attr('stroke-width',li===0?2.5:2).attr('d',lineGen);
            if (isAnimating && li===0) {
                const len = p.node().getTotalLength();
                p.attr('stroke-dasharray',`${len} ${len}`).attr('stroke-dashoffset',len)
                    .transition().duration(1500).attr('stroke-dashoffset',0);
            }
        });

        svg.append('text').attr('transform','rotate(-90)').attr('x',-ih/2).attr('y',-65)
            .attr('text-anchor','middle').style('font-size','11px').style('fill','var(--text-tertiary)')
            .text('Cumulative Count');

        const leg = svg.append('g').attr('transform',`translate(${iw+10},10)`);
        keys.forEach((k,i) => {
            leg.append('rect').attr('y',i*22).attr('width',12).attr('height',12).attr('fill',k.color).attr('rx',2);
            leg.append('text').attr('x',18).attr('y',i*22+10).style('font-size','10px').style('fill','var(--text-secondary)').text(k.label);
        });
    }

    // Crosshair hover overlay
    const mainKey = mode==='daily' ? 'newCases' : 'cases';
    const yScale2 = mode==='daily'
        ? d3.scaleLinear().domain([0, d3.max(fd,d=>Math.max(d.newCases||0,d.newDeaths||0,d.newRecovered||0))]).range([ih,0]).nice()
        : d3.scaleLinear().domain([0, d3.max(fd,d=>Math.max(d.cases||0,d.recovered||0))]).range([ih,0]).nice();

    const focus = svg.append('g').style('display','none');
    focus.append('circle').attr('r',5).attr('fill','#3B82F6').attr('stroke','#fff').attr('stroke-width',2);
    focus.append('line').attr('class','focus-line-x').attr('y1',0)
        .attr('stroke','#94A3B8').attr('stroke-width',1).attr('stroke-dasharray','4,4');

    svg.append('rect').attr('width',iw).attr('height',ih).attr('fill','none').attr('pointer-events','all')
        .on('mouseover',()=>focus.style('display',null))
        .on('mouseout',()=>{ focus.style('display','none'); getTooltip().style('opacity',0); })
        .on('mousemove', function(event) {
            const x0 = xScale.invert(d3.pointer(event)[0]);
            const bi  = d3.bisector(d=>new Date(d.date)).left;
            const i   = Math.min(bi(fd,x0,1), fd.length-1);
            const d0  = fd[i-1], d1 = fd[i];
            const d   = (d1 && Math.abs(x0-new Date(d0?.date)) > Math.abs(x0-new Date(d1.date))) ? d1 : (d0||d1);
            if (!d) return;
            const cx = xScale(new Date(d.date));
            const cy = yScale2(d[mainKey]||0);
            focus.attr('transform',`translate(${cx},${cy})`);
            focus.select('.focus-line-x').attr('y2',ih-cy);
            const dateStr = new Date(d.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
            const tip = mode==='daily'
                ? `<strong>${dateStr}</strong><br>New Cases: ${formatNumber(d.newCases)}<br>New Deaths: ${formatNumber(d.newDeaths)}<br>New Recovered: ${formatNumber(d.newRecovered)}`
                : `<strong>${dateStr}</strong><br>Confirmed: ${formatNumber(d.cases)}<br>Deaths: ${formatNumber(d.deaths)}<br>Recovered: ${formatNumber(d.recovered)}<br>Active: ${formatNumber(d.active)}`;
            getTooltip().style('opacity',1).html(tip)
                .style('left',(event.pageX+14)+'px').style('top',(event.pageY-50)+'px');
        });
}

// ── 5. Bubble Chart (Cases/M vs Deaths/M, size=Tests/M) ───────────────────────
function renderBubbleChart(data) {
    const container = document.getElementById('bubbleChart');
    if (!container) return;

    const width  = container.clientWidth || 500;
    const height = 420;
    const margin = { top: 20, right: 150, bottom: 70, left: 80 };
    const iw = width  - margin.left - margin.right;
    const ih = height - margin.top  - margin.bottom;

    d3.select('#bubbleChart').selectAll('*').remove();

    const fd = data.filter(d => d.casesPerMillion > 0 && d.deathsPerMillion > 0 && d.confirmed > 5000);
    if (!fd.length) return;

    const svg = d3.select('#bubbleChart').append('svg')
        .attr('width',width).attr('height',height)
        .append('g').attr('transform',`translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLog()
        .domain([d3.min(fd,d=>d.casesPerMillion)||1, d3.max(fd,d=>d.casesPerMillion)])
        .range([0,iw]).nice();

    const yScale = d3.scaleLog()
        .domain([d3.min(fd,d=>d.deathsPerMillion)||1, d3.max(fd,d=>d.deathsPerMillion)])
        .range([ih,0]).nice();

    const maxTests = d3.max(fd, d=>d.testsPerMillion) || 1;
    const rScale = d3.scaleSqrt().domain([0, maxTests]).range([4, 28]);

    const color = d3.scaleOrdinal().domain(Object.keys(regionColors)).range(Object.values(regionColors));

    // Explicit tick values for clean log axes — only 5-6 ticks each
    const xMax = d3.max(fd, d => d.casesPerMillion);
    const yMax = d3.max(fd, d => d.deathsPerMillion);
    const xTicks = [100, 500, 2000, 10000, 50000].filter(v => v <= xMax * 1.1);
    const yTicks = [1, 5, 20, 100, 500].filter(v => v <= yMax * 1.1);

    svg.append('g').attr('class','grid')
        .call(d3.axisLeft(yScale).tickValues(yTicks).tickSize(-iw).tickFormat(''))
        .selectAll('line').attr('stroke','rgba(148,163,184,0.12)');
    svg.select('.grid .domain').remove();

    const fmt = d => d >= 1000 ? (d/1000).toFixed(0)+'k' : String(d);

    // X axis
    svg.append('g').attr('class','axis').attr('transform',`translate(0,${ih})`)
        .call(d3.axisBottom(xScale).tickValues(xTicks).tickFormat(fmt))
        .selectAll('text').style('font-size','11px');

    // Y axis
    svg.append('g').attr('class','axis')
        .call(d3.axisLeft(yScale).tickValues(yTicks).tickFormat(fmt))
        .selectAll('text').style('font-size','11px');

    // Axis labels — well-spaced
    svg.append('text').attr('x',iw/2).attr('y',ih+52)
        .attr('text-anchor','middle')
        .style('font-size','11px').style('fill','var(--text-secondary)')
        .text('Cases per Million (log scale)');

    svg.append('text')
        .attr('transform','rotate(-90)')
        .attr('x',-ih/2).attr('y',-64)
        .attr('text-anchor','middle')
        .style('font-size','11px').style('fill','var(--text-secondary)')
        .text('Deaths per Million (log scale)');

    const gs = svg.selectAll('g.bub').data(fd).enter().append('g').attr('class','bub')
        .attr('transform',d=>`translate(${xScale(d.casesPerMillion)},${yScale(d.deathsPerMillion)})`);

    gs.append('circle')
        .attr('r', d=>rScale(d.testsPerMillion||0))
        .attr('fill', d=>color(d.continent||'Other'))
        .attr('opacity',0.72).attr('stroke','#fff').attr('stroke-width',1.5)
        .on('mouseover', function(event,d) {
            d3.select(this).attr('opacity',1);
            getTooltip().style('opacity',1)
                .html(`<strong>${d.country}</strong> (${d.continent})<br>
                    Cases/Million: ${formatNumber(d.casesPerMillion)}<br>
                    Deaths/Million: ${formatNumber(d.deathsPerMillion)}<br>
                    Tests/Million: ${formatNumber(d.testsPerMillion)}<br>
                    Fatality Rate: ${d.confirmed>0?(d.deaths/d.confirmed*100).toFixed(2):0}%`)
                .style('left',(event.pageX+10)+'px').style('top',(event.pageY-30)+'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity',0.72);
            getTooltip().style('opacity',0);
        });

    // Only label bubbles that are large enough and not too crowded
    gs.filter(d=>rScale(d.testsPerMillion||0)>16)
        .append('text').attr('text-anchor','middle')
        .attr('dy',d=>-rScale(d.testsPerMillion||0)-5)
        .style('font-size','9px').style('fill','var(--text-primary)').style('font-weight','500')
        .style('pointer-events','none')
        .text(d=>d.country.length>10?d.country.slice(0,9)+'…':d.country);

    // Continent legend — placed in right margin, outside plot area
    const leg = svg.append('g').attr('transform',`translate(${iw+12},10)`);
    leg.append('text').attr('x',0).attr('y',-4)
        .style('font-size','9px').style('font-weight','600')
        .style('fill','var(--text-secondary)').text('Continent');
    const continents = [...new Set(fd.map(d=>d.continent||'Other'))];
    continents.forEach((c,i)=>{
        leg.append('circle').attr('cx',5).attr('cy',i*17+8).attr('r',5).attr('fill',color(c)).attr('opacity',0.85);
        leg.append('text').attr('x',14).attr('y',i*17+12).style('font-size','9px').style('fill','var(--text-secondary)').text(c);
    });
    // Bubble size note below legend
    const noteY = continents.length * 17 + 22;
    leg.append('text').attr('x',0).attr('y',noteY)
        .style('font-size','8.5px').style('fill','var(--text-tertiary)').text('Bubble size =');
    leg.append('text').attr('x',0).attr('y',noteY+13)
        .style('font-size','8.5px').style('fill','var(--text-tertiary)').text('Tests/Million');

    const resetBtn = document.getElementById('resetBubbleBtn');
    if (resetBtn) {
        const nb = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(nb, resetBtn);
        nb.addEventListener('click', ()=>renderBubbleChart(data));
    }
}

// ── 6. Horizontal Bar — Fatality Rate ────────────────────────────────────────
function renderHorizontalBarChart(data) {
    const container = document.getElementById('horizontalBarChart');
    if (!container) return;

    const width  = container.clientWidth || 500;
    const height = 420;
    const margin = { top: 20, right: 70, bottom: 20, left: 120 };
    const iw = width  - margin.left - margin.right;
    const ih = height - margin.top  - margin.bottom;

    d3.select('#horizontalBarChart').selectAll('*').remove();

    const fd = [...data]
        .filter(d => d.confirmed > 10000 && d.deaths > 0)
        .map(d => ({ ...d, fatalityRate: d.deaths/d.confirmed*100 }))
        .sort((a,b)=>b.fatalityRate-a.fatalityRate)
        .slice(0,15);

    if (!fd.length) return;

    const svg = d3.select('#horizontalBarChart').append('svg')
        .attr('width',width).attr('height',height)
        .append('g').attr('transform',`translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand().domain(fd.map(d=>d.country)).range([0,ih]).padding(0.25);
    const x = d3.scaleLinear().domain([0, d3.max(fd,d=>d.fatalityRate)]).range([0,iw]).nice();

    svg.append('g').attr('class','axis').call(d3.axisLeft(y).tickSize(0)).select('.domain').remove();
    svg.append('g').attr('class','axis').call(d3.axisTop(x).tickFormat(d=>`${d.toFixed(1)}%`).ticks(5));

    const bars = svg.selectAll('rect.bar').data(fd).enter()
        .append('rect').attr('class','bar')
        .attr('y',d=>y(d.country)).attr('height',y.bandwidth())
        .attr('x',0).attr('width',0)
        .attr('fill',d=>fatalityColorScale(d.fatalityRate/100)).attr('rx',5)
        .on('mouseover', function(event,d) {
            getTooltip().style('opacity',1)
                .html(`<strong>${d.country}</strong><br>
                    Fatality Rate: ${d.fatalityRate.toFixed(2)}%<br>
                    Deaths: ${formatNumber(d.deaths)}<br>
                    Confirmed: ${formatNumber(d.confirmed)}<br>
                    Deaths/Million: ${formatNumber(d.deathsPerMillion)}`)
                .style('left',(event.pageX+10)+'px').style('top',(event.pageY-30)+'px');
            d3.select(this).attr('opacity',0.8);
        })
        .on('mouseout', function() {
            getTooltip().style('opacity',0);
            d3.select(this).attr('opacity',1);
        });

    bars.transition().duration(isAnimating?800:0).attr('width',d=>x(d.fatalityRate));

    svg.selectAll('text.bar-label').data(fd).enter()
        .append('text').attr('class','bar-label')
        .attr('x',d=>x(d.fatalityRate)+4)
        .attr('y',d=>y(d.country)+y.bandwidth()/2)
        .attr('dy','.35em').style('font-size','10px').style('fill','var(--text-secondary)')
        .text(d=>`${d.fatalityRate.toFixed(1)}%`);
}

// ── 7. Treemap ────────────────────────────────────────────────────────────────
function renderTreemapChart(data) {
    const container = document.getElementById('treemapChart');
    if (!container) return;

    const width  = container.clientWidth || 500;
    const height = 420;

    d3.select('#treemapChart').selectAll('*').remove();

    const grouped = {};
    data.forEach(d => {
        if (d.continent && d.confirmed > 0) {
            if (!grouped[d.continent]) grouped[d.continent] = [];
            grouped[d.continent].push(d);
        }
    });
    if (!Object.keys(grouped).length) return;

    const rootData = {
        name: 'root',
        children: Object.entries(grouped).map(([region,countries]) => ({
            name: region,
            children: countries.slice(0,12).map(c => ({
                name:         c.country,
                value:        c.confirmed||0,
                fatalityRate: c.confirmed>0 ? (c.deaths/c.confirmed*100) : 0,
                cpm:          c.casesPerMillion||0,
            })),
        })),
    };

    const root = d3.hierarchy(rootData).sum(d=>d.value).sort((a,b)=>b.value-a.value);
    d3.treemap().size([width,height]).padding(2).round(true)(root);

    const svg = d3.select('#treemapChart').append('svg').attr('width',width).attr('height',height);
    const color = d3.scaleOrdinal().domain(Object.keys(regionColors)).range(Object.values(regionColors));

    const cells = svg.selectAll('g.cell').data(root.leaves()).enter()
        .append('g').attr('class','cell').attr('transform',d=>`translate(${d.x0},${d.y0})`);

    cells.append('clipPath')
        .attr('id',d=>`tc-${Math.round(d.x0)}-${Math.round(d.y0)}`)
        .append('rect')
        .attr('width',d=>Math.max(0,d.x1-d.x0))
        .attr('height',d=>Math.max(0,d.y1-d.y0));

    cells.append('rect')
        .attr('width',d=>Math.max(0,d.x1-d.x0)).attr('height',d=>Math.max(0,d.y1-d.y0))
        .attr('fill',d=>color(d.parent.data.name))
        .attr('stroke','white').attr('stroke-width',2).attr('rx',4).attr('opacity',0.88)
        .style('cursor','pointer')
        .on('mouseover', function(event,d) {
            d3.select(this).attr('opacity',0.65);
            getTooltip().style('opacity',1)
                .html(`<strong>${d.data.name}</strong><br>Region: ${d.parent.data.name}<br>
                    Cases: ${formatNumber(d.data.value)}<br>
                    Cases/Million: ${formatNumber(d.data.cpm)}<br>
                    Fatality Rate: ${d.data.fatalityRate.toFixed(2)}%`)
                .style('left',(event.pageX+10)+'px').style('top',(event.pageY-30)+'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity',0.88);
            getTooltip().style('opacity',0);
        });

    cells.filter(d=>(d.x1-d.x0)>40&&(d.y1-d.y0)>20)
        .append('text').attr('x',5).attr('y',14)
        .attr('font-size',d=>Math.min(11,Math.max(7,(d.x1-d.x0)/10)))
        .attr('fill','white').attr('font-weight','600')
        .attr('clip-path',d=>`url(#tc-${Math.round(d.x0)}-${Math.round(d.y0)})`)
        .text(d=>d.data.name.length>14?d.data.name.slice(0,12)+'…':d.data.name);

    cells.filter(d=>(d.x1-d.x0)>50&&(d.y1-d.y0)>35)
        .append('text').attr('x',5).attr('y',28)
        .attr('font-size',d=>Math.min(9,Math.max(6,(d.x1-d.x0)/14)))
        .attr('fill','rgba(255,255,255,0.85)')
        .attr('clip-path',d=>`url(#tc-${Math.round(d.x0)}-${Math.round(d.y0)})`)
        .text(d=>formatNumberShort(d.data.value));
}

// ── 8. Radar Chart ───────────────────────────────────────────────────────────
function renderRadarChart(data, country1, country2) {
    const container = document.getElementById('radarChart');
    if (!container) return;

    const width  = container.clientWidth || 800;
    const height = 420;
    const radius = Math.min(width, height) / 2.8;

    d3.select('#radarChart').selectAll('*').remove();

    const c1 = data.find(d=>d.country===country1);
    const c2 = data.find(d=>d.country===country2);

    if (!c1 && !c2) {
        const ph = d3.select('#radarChart').append('div')
            .style('display','flex').style('flex-direction','column')
            .style('align-items','center').style('justify-content','center')
            .style('height','100%').style('color','var(--text-tertiary)').style('gap','12px');
        ph.append('i').attr('class','fas fa-chart-line').style('font-size','48px').style('opacity','0.3');
        ph.append('p').text('Select two countries from the dropdowns above to compare');
        return;
    }

    const metrics = [
        { name:'Cases/Million',   v1: c1?.casesPerMillion  ||0, v2: c2?.casesPerMillion  ||0, max: d3.max(data,d=>d.casesPerMillion)||1 },
        { name:'Deaths/Million',  v1: c1?.deathsPerMillion ||0, v2: c2?.deathsPerMillion ||0, max: d3.max(data,d=>d.deathsPerMillion)||1 },
        { name:'Tests/Million',   v1: c1?.testsPerMillion  ||0, v2: c2?.testsPerMillion  ||0, max: d3.max(data,d=>d.testsPerMillion)||1 },
        { name:'Total Cases',     v1: c1?.confirmed        ||0, v2: c2?.confirmed        ||0, max: d3.max(data,d=>d.confirmed)||1 },
        { name:'Total Deaths',    v1: c1?.deaths           ||0, v2: c2?.deaths           ||0, max: d3.max(data,d=>d.deaths)||1 },
        { name:'Fatality %',      v1: c1 ? (c1.deaths/c1.confirmed*100) : 0, v2: c2 ? (c2.deaths/c2.confirmed*100) : 0, max: 15 },
    ];

    const N = metrics.length;
    const aSlice = (Math.PI*2) / N;

    const svg = d3.select('#radarChart').append('svg')
        .attr('width',width).attr('height',height)
        .append('g').attr('transform',`translate(${width/2},${height/2})`);

    [0.2,0.4,0.6,0.8,1].forEach(level => {
        svg.append('circle').attr('r',radius*level)
            .attr('fill','none').attr('stroke','var(--border-color)').attr('stroke-width',0.5).attr('stroke-dasharray','3,3');
    });

    metrics.forEach((m,i) => {
        const angle = i*aSlice;
        const x = radius*Math.cos(angle-Math.PI/2);
        const y = radius*Math.sin(angle-Math.PI/2);
        svg.append('line').attr('x1',0).attr('y1',0).attr('x2',x).attr('y2',y)
            .attr('stroke','var(--border-color)').attr('stroke-width',1);
        svg.append('text').attr('x',x*1.2).attr('y',y*1.2).attr('text-anchor','middle')
            .attr('dy','0.35em').style('font-size','10px').style('fill','var(--text-tertiary)').text(m.name);
    });

    const coords = vals => metrics.map((m,i) => {
        const angle = i*aSlice;
        const r = radius * Math.min(1, (vals[i]/(m.max||1)));
        return [r*Math.cos(angle-Math.PI/2), r*Math.sin(angle-Math.PI/2)];
    });

    const lineG = d3.line().x(d=>d[0]).y(d=>d[1]).curve(d3.curveLinearClosed);

    if (c1) {
        const pts = coords(metrics.map(m=>m.v1));
        svg.append('path').datum(pts).attr('d',lineG)
            .attr('fill','rgba(59,130,246,0.2)').attr('stroke','#3B82F6').attr('stroke-width',2);
        pts.forEach(pt => svg.append('circle').attr('cx',pt[0]).attr('cy',pt[1])
            .attr('r',4).attr('fill','#3B82F6').attr('stroke','#fff').attr('stroke-width',1.5));
    }
    if (c2) {
        const pts = coords(metrics.map(m=>m.v2));
        svg.append('path').datum(pts).attr('d',lineG)
            .attr('fill','rgba(239,68,68,0.2)').attr('stroke','#EF4444').attr('stroke-width',2);
        pts.forEach(pt => svg.append('circle').attr('cx',pt[0]).attr('cy',pt[1])
            .attr('r',4).attr('fill','#EF4444').attr('stroke','#fff').attr('stroke-width',1.5));
    }

    // Legend with stats
    const leg = svg.append('g').attr('transform',`translate(${radius+15},${-radius})`);
    if (c1) {
        leg.append('rect').attr('width',12).attr('height',12).attr('fill','#3B82F6').attr('rx',3);
        leg.append('text').attr('x',18).attr('y',10).style('font-size','11px').style('fill','var(--text-secondary)').text(country1);
        leg.append('text').attr('x',0).attr('y',24).style('font-size','9px').style('fill','var(--text-tertiary)')
            .text(`${formatNumber(c1.confirmed)} cases`);
    }
    if (c2) {
        leg.append('rect').attr('width',12).attr('height',12).attr('y',38).attr('fill','#EF4444').attr('rx',3);
        leg.append('text').attr('x',18).attr('y',48).style('font-size','11px').style('fill','var(--text-secondary)').text(country2);
        leg.append('text').attr('x',0).attr('y',62).style('font-size','9px').style('fill','var(--text-tertiary)')
            .text(`${formatNumber(c2.confirmed)} cases`);
    }
}

// ── 9. Continent Outcome Chart (100% Stacked Bar) ────────────────────────────
function renderContinentOutcomeChart(data) {
    const container = document.getElementById('outcomeChart');
    if (!container) return;

    const width  = container.clientWidth || 500;
    const height = 420;
    const margin = { top: 30, right: 130, bottom: 50, left: 130 };
    const iw = width  - margin.left - margin.right;
    const ih = height - margin.top  - margin.bottom;

    d3.select('#outcomeChart').selectAll('*').remove();

    // Aggregate per continent
    const agg = {};
    data.forEach(d => {
        const c = d.continent || 'Other';
        if (!agg[c]) agg[c] = { confirmed: 0, recovered: 0, deaths: 0, active: 0 };
        agg[c].confirmed += d.confirmed || 0;
        agg[c].recovered += d.recovered || 0;
        agg[c].deaths    += d.deaths    || 0;
        agg[c].active    += d.active    || Math.max(0, (d.confirmed||0) - (d.deaths||0) - (d.recovered||0));
    });

    const fd = Object.entries(agg)
        .filter(([, v]) => v.confirmed > 0)
        .map(([continent, v]) => ({
            continent,
            recoveredPct: (v.recovered / v.confirmed * 100),
            activePct:    (v.active    / v.confirmed * 100),
            deathsPct:    (v.deaths    / v.confirmed * 100),
            total:         v.confirmed,
        }))
        .sort((a, b) => b.recoveredPct - a.recoveredPct);

    if (!fd.length) return;

    const svg = d3.select('#outcomeChart').append('svg')
        .attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand().domain(fd.map(d => d.continent)).range([0, ih]).padding(0.3);
    const x = d3.scaleLinear().domain([0, 100]).range([0, iw]);

    // Grid lines
    svg.append('g').attr('class', 'grid')
        .call(d3.axisBottom(x).tickSize(ih).tickFormat('').ticks(5))
        .attr('transform', 'translate(0,0)')
        .selectAll('line').attr('stroke', 'rgba(148,163,184,0.15)');
    svg.select('.grid .domain').remove();

    svg.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickSize(0)).select('.domain').remove();
    svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`)
        .call(d3.axisBottom(x).tickFormat(d => `${d}%`).ticks(5));

    // x-axis label
    svg.append('text').attr('x', iw / 2).attr('y', ih + 40)
        .attr('text-anchor', 'middle').style('font-size', '11px').style('fill', 'var(--text-tertiary)')
        .text('Share of Confirmed Cases (%)');

    const segments = [
        { key: 'recoveredPct', color: '#10B981', label: 'Recovered' },
        { key: 'activePct',    color: '#F59E0B', label: 'Active' },
        { key: 'deathsPct',    color: '#EF4444', label: 'Deaths' },
    ];

    fd.forEach(d => {
        let offset = 0;
        segments.forEach(seg => {
            const val = Math.max(0, d[seg.key] || 0);
            if (val < 0.1) { offset += val; return; }
            svg.append('rect')
                .attr('x', x(offset))
                .attr('y', y(d.continent))
                .attr('width', x(val))
                .attr('height', y.bandwidth())
                .attr('fill', seg.color)
                .attr('opacity', 0.85)
                .attr('rx', 3)
                .on('mouseover', function(event) {
                    d3.select(this).attr('opacity', 1);
                    getTooltip().style('opacity', 1)
                        .html(`<strong>${d.continent}</strong><br>${seg.label}: ${val.toFixed(1)}%<br>Total Confirmed: ${formatNumber(d.total)}`)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top',  (event.pageY - 30) + 'px');
                })
                .on('mouseout', function() {
                    d3.select(this).attr('opacity', 0.85);
                    getTooltip().style('opacity', 0);
                });

            if (x(val) > 28) {
                svg.append('text')
                    .attr('x', x(offset) + x(val) / 2)
                    .attr('y', y(d.continent) + y.bandwidth() / 2)
                    .attr('dy', '.35em')
                    .attr('text-anchor', 'middle')
                    .style('font-size', '9px')
                    .style('fill', 'white')
                    .style('font-weight', '600')
                    .style('pointer-events', 'none')
                    .text(`${val.toFixed(0)}%`);
            }
            offset += val;
        });
    });

    // Legend
    const leg = svg.append('g').attr('transform', `translate(${iw + 12}, ${ih / 2 - 33})`);
    segments.forEach((s, i) => {
        leg.append('rect').attr('y', i * 24).attr('width', 12).attr('height', 12).attr('fill', s.color).attr('rx', 3);
        leg.append('text').attr('x', 18).attr('y', i * 24 + 10)
            .style('font-size', '10px').style('fill', 'var(--text-secondary)').text(s.label);
    });
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function formatNumber(num) {
    if (num == null || isNaN(num)) return '0';
    if (num >= 1e9) return (num/1e9).toFixed(1)+'B';
    if (num >= 1e6) return (num/1e6).toFixed(1)+'M';
    if (num >= 1e3) return (num/1e3).toFixed(1)+'K';
    return Math.floor(num).toLocaleString();
}

function formatNumberShort(num) {
    if (num == null || isNaN(num)) return '0';
    if (num >= 1e9) return (num/1e9).toFixed(1)+'B';
    if (num >= 1e6) return (num/1e6).toFixed(1)+'M';
    if (num >= 1e3) return (num/1e3).toFixed(0)+'K';
    return Math.floor(num).toString();
}
