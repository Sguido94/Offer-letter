/**
 * Admin page logic - form handling, offer generation, list management.
 */
let editingId = null; // tracks which offer is being edited

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

        if (editingId) {
            // Update existing offer
            offer.id = editingId;
            OfferStore.save(offer);
            showToast(`Offer updated for ${offer.candidateName}!`);
            cancelEdit();
        } else {
            // Create new offer
            const saved = OfferStore.save(offer);
            showToast(`Offer created for ${saved.candidateName}!`);
            const url = buildOfferURL(offer);
            window.open(url, '_blank');
        }

        renderOffersList();
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

function loadOfferIntoForm(id) {
    const offer = OfferStore.get(id);
    if (!offer) return;

    editingId = id;

    // Populate all fields
    document.getElementById('candidateName').value = offer.candidateName || '';
    document.getElementById('position').value = offer.position || '';
    document.getElementById('team').value = offer.team || '';
    document.getElementById('location').value = offer.location || '';
    document.getElementById('startDate').value = offer.startDate || '';
    document.getElementById('manager').value = offer.manager || '';
    document.getElementById('baseSalary').value = offer.baseSalary || '';
    document.getElementById('targetCommission').value = offer.targetCommission || '';
    document.getElementById('targetBonus').value = offer.targetBonus || '';
    document.getElementById('signOnBonus').value = offer.signOnBonus || '';
    document.getElementById('shares').value = offer.shares || '';
    document.getElementById('preferredPrice').value = offer.preferredPrice || '';
    document.getElementById('strikePrice').value = offer.strikePrice || '';
    document.getElementById('vestingYears').value = offer.vestingYears || 4;
    document.getElementById('cliffMonths').value = offer.cliffMonths || 12;
    document.getElementById('lastValuation').value = offer.lastValuation || '';
    document.getElementById('lastRoundName').value = offer.lastRoundName || '';
    document.getElementById('equityType').value = offer.equityType || 'ISO';
    document.getElementById('offerPassword').value = offer.password || '';

    // Re-render benefits
    const benefitsContainer = document.getElementById('benefitsEditor');
    if (benefitsContainer && offer.benefits) {
        benefitsContainer.innerHTML = '';
        offer.benefits.forEach(b => {
            const row = document.createElement('div');
            row.className = 'benefit-edit-row';
            row.innerHTML = `
                <input type="text" class="benefit-title" placeholder="Title" value="${b.title || ''}">
                <input type="text" class="benefit-desc" placeholder="Description" value="${b.description || ''}">
                <button type="button" class="remove-benefit-btn" onclick="this.closest('.benefit-edit-row').remove()">×</button>
            `;
            benefitsContainer.appendChild(row);
        });
    }

    // Update UI to show editing state
    document.getElementById('submitBtn').textContent = 'Update Offer';
    document.getElementById('submitBtn').classList.add('btn-editing');

    // Show cancel button
    let cancelBtn = document.getElementById('cancelEditBtn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = cancelEdit;
        document.getElementById('submitBtn').insertAdjacentElement('afterend', cancelBtn);
    }

    // Scroll to top of form
    document.querySelector('.admin-header').scrollIntoView({ behavior: 'smooth' });
    showToast(`Editing offer for ${offer.candidateName}`);
}

function cancelEdit() {
    editingId = null;
    document.getElementById('submitBtn').textContent = 'Generate Offer Letter';
    document.getElementById('submitBtn').classList.remove('btn-editing');
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.remove();
}

function deleteOffer(id) {
    if (!confirm('Delete this offer? This cannot be undone.')) return;
    OfferStore.delete(id);
    if (editingId === id) cancelEdit();
    renderOffersList();
    showToast('Offer deleted.');
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
                <button class="btn btn-secondary btn-sm" onclick="loadOfferIntoForm('${offer.id}')">Edit</button>
                <button class="copy-link-btn" onclick="copyOfferLink('${offer.id}')">Copy Link</button>
                <a href="${offerURL}" target="_blank" class="btn btn-primary btn-sm">View</a>
                <button class="btn btn-danger btn-sm" onclick="deleteOffer('${offer.id}')">Delete</button>
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
