export { getViewParameters, getRows, escapeHtml };

const sourceInput = document.querySelector('textarea[name="vocabsrc"]');
const includedData = document.getElementById("included-data");

const visiblecol = document.getElementById("visiblecol");
const wordsite = document.getElementById("wordsite");
const showAll = document.getElementById("show-all");

const colSepRadios = document.querySelectorAll('input[name="colsep"]');
const rowSepRadios = document.querySelectorAll('input[name="rowsep"]');

const formatElements = ['Word', 'Reading', 'Meaning', 'Other'];

// Events
includedData.addEventListener('change', (event) => {
    updateSrcFormatDesc();
});

colSepRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        updateSrcFormatDesc();
    });
});
rowSepRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        updateSrcFormatDesc();
    });
});

function updateSrcFormatDesc() {
    const params = getViewParameters();
    // const desc = formatElements.join(params.colSep);

    const items = formatElements.slice(0, params.includedData);
    const desc = [1, 2, 3].reduce((val, i) => {
        return val + items.join(` ${i}${params.colSep}`) + ` ${i}` + params.rowSep;
    }, '');
    sourceInput.placeholder = desc;
}
updateSrcFormatDesc();

// Core
function getViewParameters() {
    const params = {};
    params.text = sourceInput.value.trim();
    params.includedData = includedData.value;

    // Row separator
    params.rowSep = "\n";
    if (document.getElementById("rowsep-2").checked) {
        params.rowSep = ";";
    }

    // Column separator
    params.colSep = "\t";
    if (document.getElementById("colsep-2").checked) {
        params.colSep = ",";
    }

    params.visibleColumn = Number(visiblecol.value);
    params.wordSite = wordsite.value;
    params.showHidden = showAll.checked;

    return params;
}

function getRows() {
    const params = getViewParameters();

    if (!params.text) {
        results.innerHTML = "<p>No data provided.</p>";
        return null;
    }

    return params.text
        .split(params.rowSep)
        .map(row => {
            row.trim();
            const cols = row.split(params.colSep);

            const first = cols[0].trim();
            const second = cols.length > 1 ? cols[1].trim() : first;
            const extra1 = cols.length > 2 ? cols[2].trim() : '';
            const extra2 = cols.length > 3 ? cols[3].trim() : '';

            const visible =
                params.visibleColumn === 1 ? first : second;

            const hidden =
                params.visibleColumn === 1 ? second : first;

            const wordForLookup = first;

            let dictionaryUrl = "";

            if (params.wordSite === "jisho") {
                dictionaryUrl =
                    `https://jisho.org/search/${encodeURIComponent(wordForLookup)}`;
            } else {
                dictionaryUrl =
                    `https://darken.github.io/rtkidx/?t=${encodeURIComponent(wordForLookup)}`;
            }

            return { visible, hidden, extra1, extra2, url: dictionaryUrl };
        }).filter(Boolean);
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
