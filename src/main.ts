function shuffle(a: any[]) {
    // taken from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

$("#generate_button").on("click", generate);
$("#beats_in_bar").on("input", generate);
$("#total_strums").on("input", generate);
$("#fix_first").on("input", generate);
$("#whitespace_fill").on("input", generate);

function generate() {
    let bib = $("#beats_in_bar").val() as number;
    let tts = $("#total_strums").val() as number;
    $("#total_strums").attr("max", 2*bib);
    if (tts > 2*bib) {
        $("#total_strums").val(2*bib);
        tts = 2*bib;
    }

    let fix_first = $("#fix_first").is(":checked") as boolean;
    $("#beats_in_bar_label").html("Beats to a bar (" + bib.toString() + ")");
    $("#total_strums_label").html("Total strums (" + tts.toString() + ")");

    if (fix_first) {
        tts -= 1;
    }

    let pattern_sig : string[] = [];
    for (let i = 0; i < bib; i++) {
        pattern_sig.push((i+1).toString());
        pattern_sig.push("+");
    }

    let pattern_all : any[] = [];
    for (let i = 0; i < bib; i++) {
        if (i != 0 || !fix_first) {
            // don't add if we're fixing the first downstream
            pattern_all.push([2*i, "↓"]);
        }
        pattern_all.push([2*i+1, "↑"]);
    }

    shuffle(pattern_all);
    let whitespaceChar = $("#whitespace_fill").val() || "&nbsp;";
    let pattern_final : string[] = Array(bib*2).fill(whitespaceChar);
    for (let i = 0; i < tts; i++) {
        console.log(pattern_all[i]);
        pattern_final[pattern_all[i][0]] = pattern_all[i][1];
    }

    if (fix_first) {
        pattern_final[0] = "↓";
    }

    $("#area_output").html(pattern_sig.join("") + "<br>" + pattern_final.join(""));
}

generate();