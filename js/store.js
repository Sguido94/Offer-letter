/**
 * Simple localStorage-based store for offer data.
 * In production, this would be replaced with an API/database.
 */
const OfferStore = {
    KEY: 'numeric_offers',

    getAll() {
        const raw = localStorage.getItem(this.KEY);
        return raw ? JSON.parse(raw) : {};
    },

    get(id) {
        return this.getAll()[id] || null;
    },

    save(offer) {
        const all = this.getAll();
        if (!offer.id) {
            offer.id = this._generateId();
            offer.createdAt = new Date().toISOString();
        }
        all[offer.id] = offer;
        localStorage.setItem(this.KEY, JSON.stringify(all));
        return offer;
    },

    delete(id) {
        const all = this.getAll();
        delete all[id];
        localStorage.setItem(this.KEY, JSON.stringify(all));
    },

    _generateId() {
        return 'offer_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }
};

/** Utility: format currency */
function fmtCurrency(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtCurrencyDecimal(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCompact(n) {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n;
}

/** Get first name from full name */
function firstName(full) {
    return (full || '').split(' ')[0];
}
