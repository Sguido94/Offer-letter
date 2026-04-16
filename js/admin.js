/**
 * Admin page logic - form handling, offer generation, list management.
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('offerForm');
    const previewBtn = document.getElementById('previewBtn');

    // Pre-fill example data for Sara Guido
    prefillExample();

    // Render existing offers
    renderOffersList();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const offer = collectFormData();
        const saved = OfferStore.save(offer);
        renderOffersList();

        // Build self-contained URL and open it
        const url = buildOfferURL(offer);
        showToast(`Offer created for ${saved.candidateName}!`);
        window.open(url, '_blank');
    });

    previewBtn.addEventListener('click', () => {
        const offer = collectFormData();
        const url = buildOfferURL(offer);
        window.open(url, '_blank');
    });
});

function prefillExample() {
    document.getElementById('candidateName').value = 'Sara Guido';
    document.getElementById('position').value = 'Engineer';
    document.getElementById('team').value = 'Engineering';
    document.getElementById('location').value = 'San Francisco, CA';
    document.getElementById('manager').value = 'Parker Gilbert';
    document.getElementById('baseSalary').value = '150000';
    document.getElementById('shares').value = '4000';

    // Set start date to a reasonable future date
    const start = new Date();
    start.setMonth(start.getMonth() + 1);
    start.setDate(1);
    document.getElementById('startDate').value = start.toISOString().split('T')[0];
}

function collectFormData() {
    const benefits = [];
    document.querySelectorAll('.benefit-edit-row').forEach(row => {
        const title = row.querySelector('.benefit-title').value.trim();
        const desc = row.querySelector('.benefit-desc').value.trim();
        if (title) benefits.push({ title, description: desc });
    });

    return {
        candidateName: document.getElementById('candidateName').value.trim(),
        position: document.getElementById('position').value.trim(),
        team: document.getElementById('team').value.trim(),
        location: document.getElementById('location').value.trim(),
        startDate: document.getElementById('startDate').value,
        manager: document.getElementById('manager').value.trim(),
        baseSalary: Number(document.getElementById('baseSalary').value) || 0,
        targetCommission: Number(document.getElementById('targetCommission').value) || 0,
        targetBonus: Number(document.getElementById('targetBonus').value) || 0,
        signOnBonus: Number(document.getElementById('signOnBonus').value) || 0,
        shares: Number(document.getElementById('shares').value) || 0,
        preferredPrice: Number(document.getElementById('preferredPrice').value) || 0,
        strikePrice: Number(document.getElementById('strikePrice').value) || 0,
        vestingYears: Number(document.getElementById('vestingYears').value) || 4,
        cliffMonths: Number(document.getElementById('cliffMonths').value) || 12,
        lastValuation: Number(document.getElementById('lastValuation').value) || 0,
        lastRoundName: document.getElementById('lastRoundName').value.trim(),
        equityType: document.getElementById('equityType').value,
        password: document.getElementById('offerPassword').value.trim() || null,
        benefits
    };
}

function renderOffersList() {
    const section = document.getElementById('offersListSection');
    const list = document.getElementById('offersList');
    const offers = OfferStore.getAll();

    // Filter out preview
    const realOffers = Object.values(offers).filter(o => o.id !== '_preview');

    if (realOffers.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    list.innerHTML = '';

    realOffers.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    realOffers.forEach(offer => {
        const item = document.createElement('div');
        item.className = 'offer-list-item';
        const date = offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : '';
        const offerURL = buildOfferURL(offer);
        item.innerHTML = `
            <div class="offer-list-info">
                <h3>${offer.candidateName}</h3>
                <p>${offer.position} &middot; ${fmtCurrency(offer.baseSalary)} base &middot; Created ${date}</p>
            </div>
            <div class="offer-list-actions">
                <button class="copy-link-btn" onclick="copyOfferLink('${offer.id}')">Copy Link</button>
                <a href="${offerURL}" target="_blank" class="btn btn-primary btn-sm">View</a>
            </div>
        `;
        list.appendChild(item);
    });
}

function copyOfferLink(id) {
    const offer = OfferStore.get(id);
    if (!offer) return;
    const url = buildOfferURL(offer);
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!');
    }).catch(() => {
        prompt('Copy this link:', url);
    });
}

function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3000);
}
