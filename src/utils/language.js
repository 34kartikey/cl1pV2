import hljs from 'highlight.js/lib/core'

// Register only the languages we support to keep bundle size reasonable
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import xml from 'highlight.js/lib/languages/xml'   // html
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)
hljs.registerLanguage('c', c)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('bash', bash)

export { hljs }

/** Options shown in the language dropdown */
export const LANGUAGE_OPTIONS = [
  { value: 'auto',       label: 'Auto-detect' },
  { value: 'text',       label: 'Plain text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python',     label: 'Python' },
  { value: 'rust',       label: 'Rust' },
  { value: 'go',         label: 'Go' },
  { value: 'java',       label: 'Java' },
  { value: 'c',          label: 'C' },
  { value: 'cpp',        label: 'C++' },
  { value: 'html',       label: 'HTML' },
  { value: 'css',        label: 'CSS' },
  { value: 'json',       label: 'JSON' },
  { value: 'markdown',   label: 'Markdown' },
  { value: 'sql',        label: 'SQL' },
  { value: 'bash',       label: 'Bash / Shell' },
]

// Ordered heuristic rules — first match wins
const HEURISTICS = [
  // JSON
  [/^\s*[\[{][\s\S]*[\]}]\s*$/, 'json'],
  // HTML/XML
  [/<!DOCTYPE\s+html|<html[\s>]|<\/?(div|span|p|a|head|body|script|style)[\s/>]/, 'html'],
  // CSS
  [/^[\s\S]*\{[\s\S]*:[\s\S]*;[\s\S]*\}/ , null], // skip — handled by hljs
  // Bash
  [/^#!.*\/(bash|sh|zsh)|^\s*(echo|export|source|apt-get|brew|chmod|grep|awk|sed)\s/m, 'bash'],
  // Python
  [/\bdef\s+\w+\s*\(|^\s*import\s+\w|^\s*from\s+\w+\s+import\s|print\s*\(/m, 'python'],
  // Rust
  [/\bfn\s+\w+|let\s+mut\s+\w+|use\s+std::|println!\s*\(|\->\s*\w+/, 'rust'],
  // TypeScript (before JS)
  [/:\s*(string|number|boolean|void|any|never)\b|interface\s+\w+|<[A-Z]\w*>|as\s+\w+\b/, 'typescript'],
  // JavaScript
  [/\b(const|let|var)\s+\w+\s*=|=>\s*\{|require\s*\(|console\.(log|error)|\.then\s*\(/, 'javascript'],
  // Go
  [/^package\s+\w+|func\s+\w+\s*\(|:=\s*|fmt\.(Print|Println|Sprintf)/m, 'go'],
  // Java (before C/C++)
  [/public\s+(static\s+)?(class|void|int|String)\b|System\.out\.(print|println)/, 'java'],
  // C++ (before C)
  [/#include\s*<[a-z_]+>|std::|cout\s*<<|cin\s*>>|nullptr|template\s*</, 'cpp'],
  // C
  [/#include\s*<(stdio|stdlib|string|math)\.h>|printf\s*\(|scanf\s*\(|malloc\s*\(/, 'c'],
  // SQL
  [/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN)\b/i, 'sql'],
  // Markdown
  [/^#{1,6}\s+\w|^\*{1,3}\w|\[.+\]\(.+\)|^---$/m, 'markdown'],
]

/**
 * Auto-detect language from text using heuristics then highlight.js.
 * Returns the detected language key (or null if confidence is too low).
 */
export function detectLanguage(text) {
  if (!text || text.trim().length < 10) return null

  // Try fast heuristics first
  for (const [regex, lang] of HEURISTICS) {
    if (lang && regex.test(text)) return lang
  }

  // Fall back to hljs auto-detect
  try {
    const result = hljs.highlightAuto(text, [
      'javascript', 'typescript', 'python', 'rust', 'go',
      'java', 'c', 'cpp', 'html', 'css', 'json',
      'markdown', 'sql', 'bash',
    ])
    if (result.relevance >= 3 && result.language) {
      return result.language
    }
  } catch (_) {}
  return null
}

/**
 * Highlight text using a specific language.
 * Returns an HTML string.
 */
export function highlight(text, language) {
  if (!text) return ''
  if (!language || language === 'text' || language === 'auto') {
    // escape HTML
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
  try {
    return hljs.highlight(text, { language }).value
  } catch (_) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

/**
 * Get a display label for a language key.
 */
export function languageLabel(key) {
  if (!key || key === 'auto') return 'Auto'
  const found = LANGUAGE_OPTIONS.find((o) => o.value === key)
  return found ? found.label : key
}
