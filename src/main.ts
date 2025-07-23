let metronomeTimerId: number | null = null;
let isPlaying = false;
let currentBeat = 0;

function playMetronome() {
    if (isPlaying) return;

    const bpmValue = $("#bpm").val() || '120';
    const bpm = parseInt(String(bpmValue), 10);

    if (isNaN(bpm) || bpm <= 0) {
        alert("Please enter a valid BPM.");
        return;
    }

    isPlaying = true;
    currentBeat = 0;

    const interval = (60 * 1000) / (bpm * 2);
    function tick() {
        const totalBeats = ($("#beats_in_bar").val() as number) * 2;
        
        $("#area_output span").removeClass("highlight");
        $(`#beat-${currentBeat}`).addClass("highlight");

        currentBeat = (currentBeat + 1) % totalBeats;
    }

    tick();
    metronomeTimerId = window.setInterval(tick, interval);
}

function stopMetronome() {
    if (!isPlaying) return;
    
    if (metronomeTimerId !== null) {
        window.clearInterval(metronomeTimerId);
    }

    metronomeTimerId = null;
    isPlaying = false;
    currentBeat = 0;

    $("#area_output span").removeClass("highlight");
}

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
$("#play_button").on("click", playMetronome);
$("#stop_button").on("click", stopMetronome);

function generate() {
    stopMetronome();

    let bib = $("#beats_in_bar").val() as number;
    let tts = $("#total_strums").val() as number;
    $("#total_strums").attr("max", 2 * bib);
    if (tts > 2 * bib) {
        $("#total_strums").val(2 * bib);
        tts = 2 * bib;
    }

    let fix_first = $("#fix_first").is(":checked") as boolean;
    $("#beats_in_bar_label").html("Beats to a bar (" + bib.toString() + ")");
    $("#total_strums_label").html("Total strums (" + tts.toString() + ")");

    if (fix_first) {
        tts -= 1;
    }

    let pattern_sig: string[] = [];
    for (let i = 0; i < bib; i++) {
        pattern_sig.push((i + 1).toString());
        pattern_sig.push("+");
    }

    let pattern_all: any[] = [];
    for (let i = 0; i < bib; i++) {
        if (i != 0 || !fix_first) {
            pattern_all.push([2 * i, "↓"]);
        }
        pattern_all.push([2 * i + 1, "↑"]);
    }

    shuffle(pattern_all);
    
    let whitespaceChar = ($("#whitespace_fill").val() as string) || "&nbsp;";
    let pattern_final: string[] = Array(bib * 2).fill(whitespaceChar);
    
    for (let i = 0; i < tts; i++) {
        pattern_final[pattern_all[i][0]] = pattern_all[i][1];
    }

    if (fix_first) {
        pattern_final[0] = "↓";
    }

    const patternHtml = pattern_final.map((char, index) => {
        return `<span id="beat-${index}">${char}</span>`;
    }).join("");

    $("#area_output").html(pattern_sig.join("") + "<br>" + patternHtml);
}

generate();