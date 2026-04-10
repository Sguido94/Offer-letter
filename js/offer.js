/**
 * Candidate-facing offer letter renderer.
 * Reads offer data from the URL hash (self-contained, no database needed).
 * Falls back to localStorage for backward compatibility.
 */
document.addEventListener('DOMContentLoaded', () => {
    let offer = null;

    // Primary: decode offer data from URL hash
    const hash = window.location.hash.slice(1);
    if (hash) {
        offer = decodeOffer(hash);
    }

    // Fallback: try localStorage by query param ID
    if (!offer) {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) offer = OfferStore.get(id);
    }

    if (!offer) {
        showError('Offer not found. The link may be invalid or expired.');
        return;
    }

    document.title = `Your Offer from Numeric - ${offer.candidateName}`;
    renderOffer(offer);
});

function showError(msg) {
    document.getElementById('app').innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;">
            <div class="logo-text" style="color:var(--black);">NUMERIC</div>
            <p style="font-size:18px;color:var(--text-secondary);">${msg}</p>
            <a href="index.html" class="btn btn-primary" style="margin-top:16px;">Go to Admin</a>
        </div>
    `;
}

function renderOffer(o) {
    // Computed values
    const grantValue = o.shares * o.preferredPrice;
    const costToExercise = o.shares * o.strikePrice;
    const netEquityValue = grantValue - costToExercise;
    const equityYear1 = grantValue / o.vestingYears;
    const totalCashComp = o.baseSalary + o.targetCommission + o.targetBonus + o.signOnBonus;
    const totalFirstYear = totalCashComp + equityYear1;
    const estimatedBenefits = 32720; // Approximate standard benefits value
    const totalWithBenefits = totalFirstYear + estimatedBenefits;

    // Format start date
    let startDateStr = 'TBD';
    if (o.startDate) {
        const d = new Date(o.startDate + 'T00:00:00');
        startDateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    // Cliff description
    const cliffYears = o.cliffMonths >= 12 ? `${Math.floor(o.cliffMonths / 12)} year` : `${o.cliffMonths} month`;

    // Benefit icons
    const benefitIcons = [
        { icon: '+', label: 'health' },
        { icon: '\u2731', label: 'time' },
        { icon: '$', label: 'money' },
        { icon: '\u2191', label: 'growth' },
        { icon: '\u2192', label: 'commute' },
        { icon: '\u2605', label: 'learning' },
    ];

    // Build compensation rows
    let compRows = '';
    const chartLabels = [];
    const chartData = [];
    const chartColors = [];

    const colorMap = [
        { color: '#7036FF', label: 'Base Salary', amount: o.baseSalary },
    ];
    if (o.targetCommission > 0) colorMap.push({ color: '#FD742F', label: 'Target Commission', amount: o.targetCommission });
    if (o.targetBonus > 0) colorMap.push({ color: '#C5CC7F', label: 'Target Bonus', amount: o.targetBonus });
    if (o.signOnBonus > 0) colorMap.push({ color: '#6D7242', label: 'Sign-on Bonus', amount: o.signOnBonus });
    colorMap.push({ color: '#44094A', label: `Equity (first 12 months)`, amount: equityYear1 });

    colorMap.forEach(item => {
        if (item.amount > 0) {
            compRows += `
                <div class="comp-row">
                    <div class="comp-label"><span class="comp-dot" style="background:${item.color}"></span> ${item.label}</div>
                    <div class="comp-amount">${fmtCurrency(item.amount)}</div>
                </div>`;
            chartLabels.push(item.label);
            chartData.push(item.amount);
            chartColors.push(item.color);
        }
    });

    // Estimated benefits row
    compRows += `
        <div class="comp-row comp-row-link" onclick="document.getElementById('benefits-section').scrollIntoView({behavior:'smooth'})">
            <div class="comp-label"><span class="comp-dot" style="background:#E9EBD6"></span> Estimated Benefits <span style="font-size:12px;color:var(--purple);margin-left:4px;">↓</span></div>
            <div class="comp-amount">${fmtCurrency(estimatedBenefits)}</div>
        </div>`;
    chartLabels.push('Est. Benefits');
    chartData.push(estimatedBenefits);
    chartColors.push('#E9EBD6');

    compRows += `
        <div class="comp-row">
            <div class="comp-label">Total First Year Compensation</div>
            <div class="comp-amount">${fmtCurrency(totalWithBenefits)}</div>
        </div>`;

    // Detail items
    let detailItems = `
        <div class="detail-item">
            <div class="label">Position</div>
            <div class="value">${o.position}</div>
        </div>`;
    if (o.team) detailItems += `
        <div class="detail-item">
            <div class="label">Team</div>
            <div class="value">${o.team}</div>
        </div>`;
    if (o.location) detailItems += `
        <div class="detail-item">
            <div class="label">Location</div>
            <div class="value">${o.location}</div>
        </div>`;
    detailItems += `
        <div class="detail-item">
            <div class="label">Start Date</div>
            <div class="value">${startDateStr}</div>
        </div>`;
    if (o.manager) detailItems += `
        <div class="detail-item">
            <div class="label">Hiring Manager</div>
            <div class="value">${o.manager}</div>
        </div>`;

    // Benefits HTML
    let benefitsHTML = '';
    (o.benefits || []).forEach((b, i) => {
        const iconObj = benefitIcons[i] || { icon: '\u2713', label: 'benefit' };
        benefitsHTML += `
            <div class="benefit-card">
                <div class="benefit-icon">${iconObj.icon}</div>
                <h4>${b.title}</h4>
                <p>${b.description}</p>
            </div>`;
    });

    // Equity opportunity valuations
    const lastVal = o.lastValuation || 375;
    const shareOfCompany = o.shares * o.preferredPrice / (lastVal * 1000000);
    const valuations = [
        { label: `$${lastVal}M (${o.lastRoundName || 'Current'})`, val: lastVal * 1000000 },
        { label: '$1B', val: 1000000000 },
        { label: '$5B', val: 5000000000 },
        { label: '$10B', val: 10000000000 },
        { label: '$30B', val: 30000000000 },
    ];
    const barLabels = valuations.map(v => v.label);
    const barData = valuations.map(v => (shareOfCompany * v.val) - costToExercise);

    // Render full page
    document.getElementById('app').innerHTML = `
        <!-- Hero -->
        <div class="hero">
            <video class="hero-video" autoplay muted loop playsinline>
                <source src="assets/Numeric-data-motion-01-purple-white.mp4" type="video/mp4">
            </video>
            <div class="hero-content">
                <img src="assets/logo-white.svg" alt="Numeric" class="hero-logo">
                <h1>Welcome, ${firstName(o.candidateName)}!</h1>
                <p class="subtitle">We're thrilled to extend this offer to you.</p>
            </div>
        </div>

        <div class="offer-container">
            <!-- Welcome Card -->
            <div class="welcome-card">
                <h2>Offer Summary</h2>
                <p>We're excited to offer you the position of <strong>${o.position}</strong> at Numeric! Below you'll find the details of your compensation package, equity opportunity, and benefits.</p>
                <div class="detail-row">
                    ${detailItems}
                </div>
            </div>

            <!-- Compensation Section -->
            <div class="section">
                <div class="section-header">Compensation</div>
                <div class="comp-layout">
                    <div class="donut-wrap">
                        <canvas id="compDonut"></canvas>
                        <div class="donut-center">
                            <div class="donut-label">Total Comp</div>
                            <div class="donut-value">${fmtCompact(totalWithBenefits)}</div>
                        </div>
                    </div>
                    <div class="comp-table">
                        ${compRows}
                    </div>
                </div>
            </div>

            <!-- Equity Section -->
            <div class="section">
                <div class="section-header">Equity Value</div>
                <div class="equity-grid">
                    <div class="equity-stat">
                        <div class="stat-label">Notional Value of Shares <sup>[1]</sup></div>
                        <div class="stat-value">${fmtCurrencyDecimal(o.preferredPrice)}</div>
                        <div class="stat-note">Based on ${o.lastRoundName || 'latest'} preferred price</div>
                    </div>
                    <div class="equity-stat">
                        <div class="stat-label">Grant Notional Value <sup>[2]</sup></div>
                        <div class="stat-value">${fmtCurrency(grantValue)}</div>
                        <div class="stat-note">Latest preferred price &times; options granted</div>
                    </div>
                    <div class="equity-stat">
                        <div class="stat-label">Strike Price (409A) <sup>[3]</sup></div>
                        <div class="stat-value">${fmtCurrencyDecimal(o.strikePrice)}</div>
                        <div class="stat-note">Subject to Board determination</div>
                    </div>
                    <div class="equity-stat">
                        <div class="stat-label">Total Cost to Exercise</div>
                        <div class="stat-value">${fmtCurrency(costToExercise)}</div>
                        <div class="stat-note">Strike price &times; shares granted</div>
                    </div>
                </div>

                <div class="formula-callout">
                    <strong>Grant notional value = Latest preferred stock price &times; options granted to you</strong><br>
                    The current value of your options is <strong>${fmtCurrency(grantValue)}</strong>. There is no guarantee your equity will be worth this much, and you should always assume the outcome is unknown.
                </div>

                <div class="equity-details-table">
                    <div class="eq-row">
                        <span class="eq-label">Equity Award (${o.equityType}s)</span>
                        <span class="eq-value">${o.shares.toLocaleString()} shares</span>
                    </div>
                    <div class="eq-row">
                        <span class="eq-label">Vesting Schedule</span>
                        <span class="eq-value" style="color: var(--purple);">${o.vestingYears} years, ${cliffYears} cliff</span>
                    </div>
                    <div class="eq-row">
                        <span class="eq-label">Cost to Exercise</span>
                        <span class="eq-value">${fmtCurrency(costToExercise)}</span>
                    </div>
                    <div class="eq-row">
                        <span class="eq-label">Gross Equity Value</span>
                        <span class="eq-value">${fmtCurrency(grantValue)}</span>
                    </div>
                    <div class="eq-row highlight">
                        <span class="eq-label">Net Equity Value</span>
                        <span class="eq-value">${fmtCurrency(netEquityValue)}</span>
                    </div>
                </div>

                <!-- Equity Opportunity Chart -->
                <div class="equity-chart-wrap">
                    <h4>Equity Opportunity</h4>
                    <p style="font-size:14px;color:#888;margin-bottom:20px;">Potential value of your equity at various company valuations (net of exercise cost)</p>
                    <div class="chart-container">
                        <canvas id="equityChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Benefits Section -->
            <div class="section" id="benefits-section">
                <div class="section-header">Benefits</div>
                <div class="benefits-value-bar">
                    <span class="bv-label">Estimated Annual Benefits Value</span>
                    <span class="bv-amount">${fmtCurrency(estimatedBenefits)}</span>
                </div>
                <div class="benefits-grid">
                    ${benefitsHTML}
                </div>
            </div>

            <!-- Footnotes -->
            <div class="footnotes">
                <p>[1] Based on the Company's most recent preferred financing stock price and is not a guarantee of present or future value. Future valuations may be higher or substantially lower.</p>
                <p>[2] Calculated by multiplying the number of options granted by the projected value based on the Company's latest preferred stock price. Does not take into account the impact of taxes. This is not intended as investment advice. Consult your own tax and financial advisors.</p>
                <p>[3] The strike price and total cost to exercise are subject to change based on the Board's determination of fair market value at the time your option is granted.</p>
            </div>

            <!-- Footer -->
            <div class="offer-footer">
                <img src="assets/logo-black.svg" alt="Numeric" class="footer-logo">
                <p>This offer is confidential and intended solely for the recipient.</p>
            </div>
        </div>
    `;

    // Render charts after DOM is ready
    setTimeout(() => {
        renderDonutChart(chartLabels, chartData, chartColors);
        renderEquityChart(barLabels, barData);
    }, 50);
}

function renderDonutChart(labels, data, colors) {
    const ctx = document.getElementById('compDonut');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ctx.label + ': ' + fmtCurrency(ctx.parsed)
                    }
                }
            }
        }
    });
}

function renderEquityChart(labels, data) {
    const ctx = document.getElementById('equityChart');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Net Equity Value',
                data,
                backgroundColor: '#7036FF',
                borderRadius: 6,
                barThickness: 48
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f0ede8' },
                    ticks: {
                        callback: val => fmtCompact(val),
                        font: { size: 12 },
                        color: '#999'
                    },
                    title: {
                        display: true,
                        text: 'Net Equity Value',
                        font: { size: 13 },
                        color: '#888'
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 12 }, color: '#999' },
                    title: {
                        display: true,
                        text: 'Company Valuation',
                        font: { size: 13 },
                        color: '#888'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const val = ctx.parsed.y;
                            if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
                            return fmtCurrency(val);
                        }
                    }
                }
            }
        }
    });
}
