#target illustrator
// Output a list of fonts as "family style<TAB>lcfiXX" at point (0, 0)

function main () {
    if (app.documents.length === 0 || app.selection.length !== 1) {
        alert("Select a single text object.");
        return;
    }

    var sel = app.selection[0];
    if (sel.typename !== "TextFrame") {
        alert("The selected object must be a text block.");
        return;
    }

    var baseFont   = sel.textRange.characterAttributes.textFont;
    var baseFamily = baseFont.family;

    // Сбор шрифтов с индексом lcfiXX из той же семьи
    var fonts = [];
    for (var i = 0; i < app.textFonts.length; i++) {
        var f = app.textFonts[i];
        if (f.family !== baseFamily) continue;

        var m = f.name.match(/lcfi(\d{2})/i);
        if (m) {
            fonts.push({ idx: parseInt(m[1], 10), font: f });
        }
    }

    if (fonts.length === 0) {
        alert("No styles with the lcfiXX index were found in the “" + baseFamily + "” family.");
        return;
    }

    // Sort by index 00…99
    fonts.sort(function (a, b) { return a.idx - b.idx; });

    // Generate strings in the format "Family Style<TAB>lcfiXX"
    var lines = [];
    for (var j = 0; j < fonts.length; j++) {
        var fnt = fonts[j].font;
        var label = fnt.family + " " + fnt.style;            // name from table ID 1 + style
        var idx   = "lcfi" + pad2(fonts[j].idx);
        lines.push(idx + "\t" + label);
    }
    var listText = lines.join("\r");   // \r – line break for Illustrator

    // Output to a new text frame
    var doc = app.activeDocument;
    var tf = doc.textFrames.add();
    tf.contents  = listText;
    tf.position = [0, 0];  // X, Y (from the top-left corner of the artboard)

    /* ---- IF YOU NEED EACH LINE TO USE ITS OWN FONT ----
    var story = tf.story;
    for (var k = 0; k < fonts.length; k++) {
        var para = story.paragraphs[k];
        para.characterAttributes.textFont = fonts[k].font;
    }
    // ---------------------------------------------------------------- */
}

function pad2 (n) {
    n = parseInt(n, 10);
    return (n < 10 ? "0" : "") + n;
}

main();
