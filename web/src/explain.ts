/** Generates a brief "why" explanation for a math question + answer. */
export function explainAnswer(prompt: string, answer: string): string {
    // Detect operation from prompt
    if (prompt.includes('+')) {
        const m = prompt.match(/^(\d+)\s*\+\s*(\d+)/)
        if (m) {
            const a = Number(m[1]), b = Number(m[2])
            return `Count on ${b} from ${a}: ${Array.from({ length: b + 1 }, (_, i) => a + i).join(' → ')}`
        }
    }
    if (prompt.includes('−') || prompt.match(/\d\s*-\s*\d/)) {
        const m = prompt.match(/^(\d+)\s*[-−]\s*(\d+)/)
        if (m) {
            const a = Number(m[1]), b = Number(m[2])
            const steps = Array.from({ length: b + 1 }, (_, i) => a - i).join(' → ')
            return `Count back ${b} from ${a}: ${steps}`
        }
    }
    if (prompt.includes('×')) {
        const m = prompt.match(/^(\d+)\s*×\s*(\d+)/)
        if (m) {
            const a = Number(m[1]), b = Number(m[2])
            const groups = Array.from({ length: a }, () => b).join(' + ')
            return `${a} groups of ${b}: ${groups} = ${answer}`
        }
    }
    if (prompt.includes('÷')) {
        const m = prompt.match(/^(\d+)\s*÷\s*(\d+)/)
        if (m) {
            const a = Number(m[1]), b = Number(m[2])
            const q = Math.floor(a / b)
            return `${b} × ${q} = ${b * q} → ${a} ÷ ${b} = ${answer}`
        }
        // remainder format: no clean match, just show the answer
        return `Answer: ${answer}`
    }
    return ''
}
