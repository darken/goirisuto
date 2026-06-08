import { getViewParameters, getRows, escapeHtml } from "./view.js";

// TODO put them in view
const results = document.getElementById("results");
const generateBtn = document.getElementById("generate");
const generatePDFBtn = document.getElementById("generate-pdf");
const previewTitle = document.getElementById("preview-title");

// Events
generateBtn.addEventListener("click", generatePreview);
function generatePreview() {
    results.innerHTML = "";

    const rows = getRows();
    if (!rows) {
        return;
    }

    const showHidden = getViewParameters().showHidden;

    previewTitle.classList.remove('hide');
    //visible, hidden, extra1, extra2, url: dictionaryUrl
    for (const row of rows) {
        let hidden = '';
        if (showHidden) {
            hidden = `
            <div class="detail">
                ${escapeHtml(row.hidden)}
            </div>
            `;

            if (row.extra1) {
                hidden += `
                <div class="detail">
                    ${escapeHtml(row.extra1 || '')}
                </div>
                `;
            }

            if (row.extra2) {
                hidden += `
                <div class="detail">
                    ${escapeHtml(row.extra2 || '')}
                </div>
                `;
            }
        }

        const article = document.createElement("article");
        article.classList.add('result-item');
        article.innerHTML = `
        <div>
            <div class="word">
                <label>
                    <a
                        href="${row.url}"
                        class="primary"
                        target="_blank"
                        rel="noopener noreferrer"
                    >${escapeHtml(row.visible)}</a>
                </label>
            </div>
            ${hidden}
        </div>
        `;
        results.appendChild(article);
    }
}

generatePDFBtn.addEventListener("click", generatePdf);
async function generatePdf() {
    const rows = getRows();
    if (!rows) {
        return;
    }

    const viewParams = getViewParameters();
    const showHidden = viewParams.showHidden;

    const pdfDoc = await PDFLib.PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontBytes = await fetch('./fonts/NotoSansJP-Regular.ttf')
        .then(res => res.arrayBuffer());
    const font = await pdfDoc.embedFont(fontBytes);

    const fontSize = showHidden ? 22 : 26;
    const marginX = 40;
    const marginY = 60;
    const lineHeight = viewParams.showHidden ? 52 : 70;

    let page = pdfDoc.addPage();
    let { width, height } = page.getSize();

    let y = height - marginY - (viewParams.showHidden ? 20 : 30);

    for (const row of rows) {
        const visible = row.visible;
        const hidden = row.hidden || "";
        const extra1 = row.extra1 || "";
        const extra2 = row.extra2 || "";
        const url = row.url || "";

        if (y < marginY) {
            page = pdfDoc.addPage();
            ({ width, height } = page.getSize());
            y = height - marginY;
        }

        page.drawText(visible, {
            x: marginX,
            y,
            size: fontSize,
            font
        });

        const textWidth = font.widthOfTextAtSize(visible, fontSize);

        let annots =
            page.node.lookupMaybe(
                PDFLib.PDFName.of('Annots'),
                PDFLib.PDFArray
            );
        if (!annots) {
            annots = pdfDoc.context.obj([]);
            page.node.set(
                PDFLib.PDFName.of('Annots'),
                annots
            );
        }

        // Link annotation over the word
        if (url) {
            const linkAnnot = pdfDoc.context.obj({
                Type: 'Annot',
                Subtype: 'Link',
                Rect: [
                    marginX,
                    y - 2,
                    marginX + textWidth,
                    y + fontSize + 2
                ],
                Border: [0, 0, 0],
                A: {
                    Type: 'Action',
                    S: 'URI',
                    URI: PDFLib.PDFString.of(url)
                }
            });

            annots.push(
                pdfDoc.context.register(linkAnnot)
            );
        }

        if (viewParams.showHidden) {
            const hiddenText = [
                hidden,
                extra1,
                extra2
            ]
                .filter(Boolean)
                .join('   ');

            page.drawText(hiddenText, {
                x: marginX + 24,
                y: y - 20,
                size: 14,
                font
            });

            y -= 20;
        }

        y -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob(
        [pdfBytes],
        { type: "application/pdf" }
    );

    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.target = "_blank";
    a.download = `vocab_${viewParams.visibleColumn == 1 ? 'word' : 'read'}_${viewParams.wordSite}_${viewParams.showHidden ? 'all' : 'term'}.pdf`;
    a.click();

    URL.revokeObjectURL(downloadUrl);
}

