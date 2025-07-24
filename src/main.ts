let audioCtx: AudioContext | null = null;
let metronomeTimerId: number | null = null;
let isPlaying = false;
let currentBeat = 0;

function adjustFontSize() {
    const outputArea = $('#area_output');
    outputArea.css('font-size', ''); 

    const outputElement = outputArea[0];
    let currentFontSize = parseFloat(window.getComputedStyle(outputElement).fontSize);
    
    while (outputElement.scrollWidth > outputElement.clientWidth && currentFontSize > 8) {
        currentFontSize--;
        outputArea.css('font-size', currentFontSize + 'px');
    }
}

function initAudio() {
    if (audioCtx === null) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
}

function playSound(isStrongBeat: boolean) {
    if (audioCtx === null) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = isStrongBeat ? 880.0 : 440.0; 

    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
}

function playHiHatSound() {
    if (audioCtx === null) return;

    const gainNode = audioCtx.createGain();
    const now = audioCtx.currentTime;

    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;

    const highPassFilter = audioCtx.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.value = 7000;

    whiteNoise.connect(highPassFilter);
    highPassFilter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.08);
}

function tick() {
    const subdivision = parseInt($("#subdivision").val() as string, 10);
    const totalSlots = ($("#beats_in_bar").val() as number) * subdivision;
    
    $("#area_output span").removeClass("highlight");
    $(`#beat-${currentBeat}`).addClass("highlight");

    if (currentBeat % subdivision === 0) {
        playSound(currentBeat === 0);
    } else {
        playHiHatSound();
    }

    currentBeat = (currentBeat + 1) % totalSlots;
}

function playMetronome() {
    if (isPlaying) return;
    initAudio();

    const bpmValue = $("#bpm").val() || '120';
    const bpm = parseInt(String(bpmValue), 10);
    const subdivision = parseInt($("#subdivision").val() as string, 10);

    if (isNaN(bpm) || bpm <= 0) {
        alert("Please enter a valid BPM.");
        return;
    }

    isPlaying = true;
    currentBeat = 0;

    const interval = (60 * 1000) / (bpm * subdivision);

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
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

$("#generate_button").on("click", generate);
$("#beats_in_bar").on("input", generate);
$("#subdivision").on("input", generate); 
$("#total_strums").on("input", generate);
$("#fix_first").on("input", generate);
$("#whitespace_fill").on("input", generate);
$("#play_button").on("click", playMetronome);
$("#stop_button").on("click", stopMetronome);
$(window).on('resize', adjustFontSize);

$('#bpm').on('input', function() {
    // Só faz algo se o metrônomo já estiver tocando
    if (isPlaying && metronomeTimerId !== null) {
        
        // 1. Para o timer atual
        window.clearInterval(metronomeTimerId);

        // 2. Lê o novo valor de BPM e recalcula o intervalo
        const bpmValue = $("#bpm").val() || '120';
        const bpm = parseInt(String(bpmValue), 10);
        const subdivision = parseInt($("#subdivision").val() as string, 10);

        // Se o valor for inválido, apenas para de atualizar.
        if (isNaN(bpm) || bpm <= 0) {
            return;
        }

        const newInterval = (60 * 1000) / (bpm * subdivision);

        // 3. Inicia um novo timer com o novo intervalo, continuando de onde parou
        metronomeTimerId = window.setInterval(tick, newInterval);
    }
});

function generate() {
    stopMetronome();

    const bib = $("#beats_in_bar").val() as number;
    const subdivision = parseInt($("#subdivision").val() as string, 10);
    let tts = $("#total_strums").val() as number;
    
    const totalSlots = bib * subdivision;
    $("#total_strums").attr("max", totalSlots);
    if (tts > totalSlots) {
        $("#total_strums").val(totalSlots);
        tts = totalSlots;
    }

    let fix_first = $("#fix_first").is(":checked") as boolean;
    $("#beats_in_bar_label").html("Beats to a bar (" + bib.toString() + ")");
    $("#total_strums_label").html("Total strums (" + tts.toString() + ")");

    if (fix_first) { tts -= 1; }
    
    const signatureSymbols = { 2: ['+'], 3: ['t', 'a'], 4: ['e', '+', 'a'] };
    let pattern_sig: string[] = [];
    for (let i = 0; i < bib; i++) {
        pattern_sig.push((i + 1).toString());
        const key = subdivision as keyof typeof signatureSymbols;
        if (signatureSymbols[key]) { pattern_sig.push(...signatureSymbols[key]); }
    }

    let pattern_all: any[] = [];
    for (let i = 0; i < totalSlots; i++) {
        if (i === 0 && fix_first) continue;
        const direction = (i % 2 === 0) ? "↓" : "↑";
        pattern_all.push([i, direction]);
    }

    shuffle(pattern_all);
    
    let whitespaceChar = ($("#whitespace_fill").val() as string) || "·";
    let pattern_final: string[] = Array(totalSlots).fill(whitespaceChar);
    
    for (let i = 0; i < tts; i++) {
        pattern_final[pattern_all[i][0]] = pattern_all[i][1];
    }

    if (fix_first) { pattern_final[0] = "↓"; }
    
    const topLineHtml = pattern_sig.map(char => `<span>${char}</span>`).join("");
    
    const bottomLineHtml = pattern_final.map((char, index) => {
        return `<span id="beat-${index}">${char}</span>`;
    }).join("");

    $("#area_output").html(topLineHtml + "<br>" + bottomLineHtml);
    
    adjustFontSize();
}

generate();