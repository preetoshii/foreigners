import { parse } from '../src/parser.js';
// ============================================
// DOM Elements
// ============================================
const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const parseBtn = document.getElementById('parse-btn');
// ============================================
// Sample FSL
// ============================================
const SAMPLE_FSL = `seed: 12345

@rainbow-cafe

mario: Hey Luigi.
luigi: Hey.

mario: [happy] Good to see you, brother!
luigi: Yeah, you too.

mario: How's everything going?
luigi: [nervous] It's been busy.

mario: [curious] Busy with what?
luigi: Oh, you know... stuff.

mario: [calm] Whoa, relax. [concerned] I'm just asking.
luigi: [guilty] Sorry. [sad] It's been a rough week.

mario: [sympathetic] [...]
luigi: [vulnerable] [...]

mario: [gentle] What happened?
luigi: [ashamed] I lost the family recipe book.
mario: [shocked] You what?! [softening] But... accidents happen.

luigi: [hopeful] You're not mad?
mario: [warm] I'm mad. [forgiving] But you're my brother.
`;
// ============================================
// Parse and Display
// ============================================
function runParser() {
    const input = inputEl.value;
    try {
        const result = parse(input);
        console.log('Parsed result:', result);
        outputEl.textContent = JSON.stringify(result, null, 2);
        outputEl.classList.remove('error');
    }
    catch (err) {
        console.error('Parse error:', err);
        outputEl.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
        outputEl.classList.add('error');
    }
}
// ============================================
// Event Listeners
// ============================================
parseBtn.addEventListener('click', runParser);
// Auto-parse on input (with debounce)
let debounceTimer;
inputEl.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(runParser, 300);
});
// ============================================
// Initialize
// ============================================
inputEl.value = SAMPLE_FSL;
runParser();
//# sourceMappingURL=main.js.map