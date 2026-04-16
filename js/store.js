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

// Signing secret — prevents candidates from tampering with offer data in the URL.
// Note: this is client-side so determined attackers could find it, but it stops
// casual URL manipulation. For full security, use a backend.
const SIGN_SECRET = 'num3r1c-0ff3r-s1gn-k3y-2026';

/**
 * Simple deterministic hash of a string (djb2).
 */
function _hashString(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h) ^ str.charCodeAt(i);
        h = h >>> 0; // keep unsigned 32-bit
    }
    return h.toString(36);
}

/**
 * Generate a signature for an offer object.
 * Signs the core financial fields so any tampering is detected.
 */
function signOffer(offer) {
    const payload = [
        offer.candidateName,
        offer.position,
        offer.baseSalary,
        offer.targetCommission,
        offer.targetBonus,
        offer.signOnBonus,
        offer.shares,
        offer.preferredPrice,
        offer.strikePrice,
        offer.vestingYears,
        offer.cliffMonths,
        SIGN_SECRET
    ].join('|');
    return _hashString(payload);
}

/**
 * Verify that an offer's signature matches its data.
 */
function verifyOffer(offer) {
    if (!offer._sig) return false;
    return offer._sig === signOffer(offer);
}

/**
 * Encode offer data into a URL-safe base64 string, with signature.
 */
function encodeOffer(offer) {
    const signed = Object.assign({}, offer, { _sig: signOffer(offer) });
    const json = JSON.stringify(signed);
    return btoa(unescape(encodeURIComponent(json)));
}

/**
 * Decode and verify offer data from a URL-safe base64 string.
 * Returns null if tampered with.
 */
function decodeOffer(encoded) {
    try {
        const json = decodeURIComponent(escape(atob(encoded)));
        const offer = JSON.parse(json);
        // If the offer has a signature, verify it. If no signature, it's a legacy offer — allow it.
        if (offer._sig && !verifyOffer(offer)) return { _tampered: true };
        return offer;
    } catch (e) {
        return null;
    }
}

/**
 * Build a shareable offer URL with all data encoded in the hash.
 */
function buildOfferURL(offer, baseURL) {
    const encoded = encodeOffer(offer);
    const base = baseURL || window.location.href.replace(/[^/]*$/, '');
    return base + 'offer.html#' + encoded;
}
