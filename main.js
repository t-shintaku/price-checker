// State Management
const state = {
    a: { price: '', amount: '' },
    b: { price: '', amount: '' },
    activeField: { product: 'a', field: 'price' } // Default focus
};

// DOM Elements
const elements = {
    a: {
        price: document.getElementById('display-price-a'),
        amount: document.getElementById('display-amount-a'),
        unitPrice: document.getElementById('unit-price-a'),
        card: document.getElementById('card-a')
    },
    b: {
        price: document.getElementById('display-price-b'),
        amount: document.getElementById('display-amount-b'),
        unitPrice: document.getElementById('unit-price-b'),
        card: document.getElementById('card-b')
    },
    resultBanner: document.getElementById('result-banner'),
    resultText: document.querySelector('.result-text')
};

// Next field progression logic
const fieldProgression = [
    { p: 'a', f: 'price' },
    { p: 'a', f: 'amount' },
    { p: 'b', f: 'price' },
    { p: 'b', f: 'amount' }
];

// Initialize
function init() {
    setupEventListeners();
    updateUI();
    registerServiceWorker();
}

function setupEventListeners() {
    // Input fields click (tap to focus)
    ['a', 'b'].forEach(prod => {
        ['price', 'amount'].forEach(fld => {
            elements[prod][fld].addEventListener('click', () => {
                setActiveField(prod, fld);
            });
        });
    });

    // Keypad clicks
    document.querySelectorAll('.numpad button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleKeyPress(e.target.dataset.key);
        });
    });
}

function setActiveField(product, field) {
    state.activeField = { product, field };
    updateUI();
}

function handleKeyPress(key) {
    const { product, field } = state.activeField;
    let currentVal = state[product][field];

    if (key === 'AC') {
        state[product][field] = '';
    } else if (key === 'BS') {
        state[product][field] = currentVal.slice(0, -1);
    } else if (key === 'NEXT') {
        moveToNextField();
        return; // calculate and UI updated inside moveToNextField (technically, setActiveField)
    } else if (key === '.') {
        if (!currentVal.includes('.')) {
            state[product][field] = currentVal === '' ? '0.' : currentVal + '.';
        }
    } else if (key === '00') {
        if (currentVal !== '' && currentVal !== '0') {
            state[product][field] = currentVal + '00';
        }
    } else {
        // Number
        if (currentVal === '0' && key !== '.') {
            state[product][field] = key;
        } else {
            // Prevent extremely long inputs
            if (currentVal.length < 9) {
                state[product][field] = currentVal + key;
            }
        }
    }

    calculate();
    updateUI();
}

function moveToNextField() {
    const currentIndex = fieldProgression.findIndex(
        item => item.p === state.activeField.product && item.f === state.activeField.field
    );

    const nextIndex = (currentIndex + 1) % fieldProgression.length;
    setActiveField(fieldProgression[nextIndex].p, fieldProgression[nextIndex].f);
}

function formatNumber(numStr) {
    if (numStr === '') return '0';
    // preserve trailing decimal point for typing
    if (numStr.endsWith('.')) return parseFloat(numStr).toLocaleString('en-US') + '.';

    const parts = numStr.split('.');
    parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
    return parts.join('.');
}

function calculate() {
    let unitPrices = { a: null, b: null };

    ['a', 'b'].forEach(prod => {
        const p = parseFloat(state[prod].price);
        const a = parseFloat(state[prod].amount);

        if (!isNaN(p) && !isNaN(a) && a > 0) {
            // Calculate price per 1 unit
            unitPrices[prod] = (p / a);

            // Update unit price display
            const formattedUnitPrice = (unitPrices[prod] < 10 && unitPrices[prod] > 0) ?
                unitPrices[prod].toFixed(2) :
                Math.round(unitPrices[prod]).toLocaleString('en-US');
            elements[prod].unitPrice.textContent = `${formattedUnitPrice} 円/1単位`;
        } else {
            elements[prod].unitPrice.textContent = `-- 円/1単位`;
        }
    });

    updateResult(unitPrices);
}

function updateResult(unitPrices) {
    elements.a.card.classList.remove('winner');
    elements.b.card.classList.remove('winner');

    const banner = elements.resultBanner;

    if (unitPrices.a !== null && unitPrices.b !== null) {
        banner.classList.remove('neutral');

        // Both items have valid values
        if (unitPrices.a < unitPrices.b) {
            elements.a.card.classList.add('winner');
            const diff = unitPrices.b - unitPrices.a;
            elements.resultText.textContent = `Aの方が 1単位あたり ¥${formatDiff(diff)} 安い！`;
        } else if (unitPrices.b < unitPrices.a) {
            elements.b.card.classList.add('winner');
            const diff = unitPrices.a - unitPrices.b;
            elements.resultText.textContent = `Bの方が 1単位あたり ¥${formatDiff(diff)} 安い！`;
        } else {
            banner.classList.add('neutral');
            elements.resultText.textContent = '単価は全く同じです';
        }
    } else {
        // Missing info
        banner.classList.add('neutral');
        elements.resultText.textContent = '数値を入力してください';
    }
}

function formatDiff(diff) {
    return diff < 1 ? diff.toFixed(1) : Math.round(diff).toLocaleString('en-US');
}

function updateUI() {
    ['a', 'b'].forEach(prod => {
        ['price', 'amount'].forEach(fld => {
            const el = elements[prod][fld];
            // Update value text
            el.textContent = formatNumber(state[prod][fld]);

            // Update focus state
            if (state.activeField.product === prod && state.activeField.field === fld) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    });
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
}

// Start app
init();
