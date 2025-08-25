#target illustrator

// ================== SETTINGS ==================
// Maximum brightness for auto-generation (0xFF = white). Change to 0x99 for an example like 000000..999999.
var AUTO_GRAY_MAX = 0xFF; // 255
// =================================================

function main() {
    if (app.documents.length === 0 || app.selection.length !== 1) {
        alert("Select a single text object.");
        return;
    }

    var sel = app.selection[0];
    if (sel.typename !== "TextFrame") {
        alert("The selected object must be a text block.");
        return;
    }

    var baseFont = sel.textRange.characterAttributes.textFont;
    var baseFontName = baseFont.name;
    var baseFontFamily = baseFont.family;
    var match = baseFontName.match(/lcfi(\d{2})/i);
    if (!match) {
        alert("The 'lcfi' index was not found.");
        return;
    }

    var baseIndex = parseInt(match[1], 10);
    var fontMap = {};

    for (var i = 0; i < app.textFonts.length; i++) {
        var font = app.textFonts[i];
        if (font.family !== baseFontFamily) continue;

        var fontMatch = font.name.match(/lcfi(\d{2})/i);
        if (fontMatch) {
            var idx = parseInt(fontMatch[1], 10);
            fontMap[idx] = font;
        }
    }

    var hasFonts = false;
    for (var k in fontMap) {
        if (fontMap.hasOwnProperty(k)) {
            hasFonts = true;
            break;
        }
    }
    if (!hasFonts) {
        alert("No other fonts with the 'lcfi' index were found in the current family '" + baseFontFamily + "'.");
        return;
    }

    // Build a continuous sequence of indexes from baseIndex down and up
    var sequence = [baseIndex];
    var i = baseIndex + 1;
    while (fontMap.hasOwnProperty(i)) {
        sequence.push(i);
        i++;
    }
    i = baseIndex - 1;
    while (fontMap.hasOwnProperty(i)) {
        sequence.unshift(i);
        i--;
    }

    // Duplicate the text object for each found style
    var groupItems = [];
    for (var j = 0; j < sequence.length; j++) {
        var idx = sequence[j];
        var copy = sel.duplicate();
        copy.textRange.characterAttributes.textFont = fontMap[idx];
        groupItems.push({ index: idx, textFrame: copy });
    }

    // Delete the original after duplication
    sel.remove();

    // Группируем
    var group = app.activeDocument.groupItems.add();
    for (var m = 0; m < groupItems.length; m++) {
        groupItems[m].textFrame.moveToBeginning(group);
    }

    // Show color selection dialog (with gray auto-fill)
    showColorDialog(groupItems);
}

// --- Auto-generate an array of gray values (strings in "RRGGBB" format) ---
function generateGrayHexes(count) {
    var arr = [];
    if (count <= 1) {
        arr.push("000000");
        return arr;
    }
    var maxVal = AUTO_GRAY_MAX; // 0..255 or another value if desired
    for (var i = 0; i < count; i++) {
        var val = Math.round(maxVal * (i / (count - 1)));
        if (val < 0) val = 0;
        if (val > 255) val = 255; // защитно
        var h = val.toString(16);
        if (h.length < 2) h = "0" + h;
        h = h.toUpperCase();
        arr.push(h + h + h);
    }
    return arr;
}

function showColorDialog(items) {
    var doc = app.activeDocument;
    var win = new Window("dialog", "Color selection by indexes");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];

    // Scrollable panel (in case of a large number of lcfi items)
    var scrollGroup = win.add("group");
    scrollGroup.orientation = "column";
    scrollGroup.alignChildren = ["left", "top"];

    // Get the auto palette
    var autoHexes = generateGrayHexes(items.length);

    var fields = {};
    for (var i = 0; i < items.length; i++) {
        var idx = items[i].index;
        var grp = scrollGroup.add("group");
        grp.add("statictext", undefined, "lcfi" + pad2(idx) + ": #");
        var defaultHex = autoHexes[i];
        var field = grp.add("edittext", undefined, defaultHex);
        field.characters = 6;
        fields[idx] = field;
    }

    var btnGroup = win.add("group");
    btnGroup.alignment = "center";
    var ok = btnGroup.add("button", undefined, "OK", { name: "ok" });
    var cancel = btnGroup.add("button", undefined, "Cancel", { name: "cancel" });

    ok.onClick = function () {
        for (var i = 0; i < items.length; i++) {
            var idx = items[i].index;
            var hex = fields[idx].text;
            if (!/^([0-9A-Fa-f]{6})$/.test(hex)) {
                alert("Invalid hex code for lcfi" + pad2(idx) + ": " + hex);
                return; // останемся в диалоге
            }
            var rgb = hexToRGB(hex);
            var swatchName = "lcfi" + pad2(idx) + "_#" + hex.toUpperCase();

            var color = new RGBColor();
            color.red = rgb[0];
            color.green = rgb[1];
            color.blue = rgb[2];

            var spotColor = makeGlobal(color, swatchName);
            var swatch;
            try {
                swatch = doc.swatches.getByName(swatchName);
            } catch (e) {
                swatch = doc.swatches.add();
                swatch.name = swatchName;
                swatch.color = spotColor;
            }

            items[i].textFrame.textRange.characterAttributes.fillColor = swatch.color;
        }
        win.close();
    };

    cancel.onClick = function () {
        win.close();
    };

    win.show();
}

function pad2(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) return "00";
    return (n < 10 ? "0" : "") + n;
}

function hexToRGB(hex) {
    return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16)
    ];
}

function makeGlobal(rgbColor, swatchName) {
    var doc = app.activeDocument;

    var spot;
    try {
        spot = doc.spots.getByName(swatchName);
    } catch (e) {
        spot = doc.spots.add();
        spot.name = swatchName;
        spot.colorType = ColorModel.PROCESS;

        var color = new RGBColor();
        color.red = rgbColor.red;
        color.green = rgbColor.green;
        color.blue = rgbColor.blue;

        spot.color = color;
    }

    var spotColor = new SpotColor();
    spotColor.spot = spot;
    spotColor.tint = 100;

    return spotColor;
}

main();
