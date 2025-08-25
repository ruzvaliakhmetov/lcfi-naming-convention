#target illustrator

function main() {
    if (app.documents.length === 0 || app.selection.length !== 1) {
        alert("Select a single group containing text objects.");
        return;
    }

    var sel = app.selection[0];
    if (sel.typename !== "GroupItem") {
        alert("The selection must be a group.");
        return;
    }

    var group = sel;
    var items = [];

    // Collect text objects with the lcfiXX index
    for (var i = 0; i < group.pageItems.length; i++) {
        var item = group.pageItems[i];
        if (item.typename !== "TextFrame") continue;

        var fontName = item.textRange.characterAttributes.textFont.name;
        var match = fontName.match(/lcfi(\d{2})/i);
        if (!match) continue;

        var idx = parseInt(match[1], 10);
        items.push({ index: idx, textFrame: item });
    }

    if (items.length === 0) {
        alert("No text objects with the 'lcfi' index were found in the group.");
        return;
    }

    // Sort by index
    items.sort(function (a, b) {
        return a.index - b.index;
    });

    // Reorder within the group: start from the bottommost (first in the array)
    for (var j = 0; j < items.length; j++) {
        items[j].textFrame.moveToBeginning(group); // moveToBeginning = to the bottom
    }

    alert("Objects are sorted by lcfi indexes.");
}

main();
