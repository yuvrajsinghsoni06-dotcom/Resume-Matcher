// =============================================================================
// ML-Style Resume Scoring Engine
// No external APIs — runs 100% in-browser using TF-IDF + Cosine Similarity
// Inspired by resumematcher.fyi
// =============================================================================

const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','been','being','but','by','for','from',
  'had','has','have','he','her','him','his','how','i','if','in','into','is',
  'it','its','just','me','my','no','not','of','on','or','our','out','she',
  'should','so','some','such','than','that','the','their','them','then',
  'there','these','they','this','to','too','up','us','was','we','were',
  'what','when','which','while','who','will','with','you','your'
]);

// High-value tech / professional skill indicators (boost weight)
const HIGH_VALUE_TERMS = new Set([
  'python','javascript','typescript','react','node','aws','azure','gcp','docker',
  'kubernetes','sql','nosql','mongodb','postgresql','mysql','redis','git',
  'agile','scrum','machine','learning','deep','neural','nlp','api','rest',
  'graphql','ci','cd','devops','linux','java','c++','scala','spark','hadoop',
  'tensorflow','pytorch','keras','pandas','numpy','scikit','flask','django',
  'fastapi','spring','microservices','cloud','security','testing','jest',
  'selenium','figma','ux','ui','product','management','leadership','analytics',
  'tableau','powerbi','excel','finance','accounting','marketing','sales',
  'communication','collaboration','strategy','design','architecture',
]);

// =============================================================================
// Tokenization & Normalization
// =============================================================================

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/** Extract unigrams + bigrams for richer phrase matching */
function extractNgrams(text) {
  const tokens = tokenize(text);
  const ngrams = [...tokens];
  for (let i = 0; i < tokens.length - 1; i++) {
    ngrams.push(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return ngrams;
}

// =============================================================================
// TF-IDF Vectorizer (2-document corpus: JD vs Resume)
// =============================================================================

function buildTFVector(tokens) {
  const freq = {};
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }
  const total = tokens.length || 1;
  const tf = {};
  for (const [t, count] of Object.entries(freq)) {
    tf[t] = count / total;
  }
  return tf;
}

function buildIDFMap(doc1Tokens, doc2Tokens) {
  const allTerms = new Set([...doc1Tokens, ...doc2Tokens]);
  const idf = {};
  for (const term of allTerms) {
    const inDoc1 = doc1Tokens.includes(term) ? 1 : 0;
    const inDoc2 = doc2Tokens.includes(term) ? 1 : 0;
    const df = inDoc1 + inDoc2;
    // Classic IDF: log(N / df) + 1; N=2 docs
    idf[term] = Math.log(2 / df) + 1;
  }
  return idf;
}

function buildTFIDFVector(tfMap, idfMap) {
  const vec = {};
  for (const [term, tfVal] of Object.entries(tfMap)) {
    const boost = HIGH_VALUE_TERMS.has(term) ? 1.5 : 1.0;
    vec[term] = tfVal * (idfMap[term] || 1) * boost;
  }
  return vec;
}

// =============================================================================
// Cosine Similarity
// =============================================================================

function cosineSimilarity(vecA, vecB) {
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;
  for (const k of allKeys) {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot  += a * b;
    magA += a * a;
    magB += b * b;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// =============================================================================
// Keyword / Phrase Matching (original logic, enhanced with bigrams)
// =============================================================================

function keywordMatch(jdTokens, resumeTokens) {
  const jdSet   = new Set(jdTokens);
  const resumeSet = new Set(resumeTokens);

  const matched = [];
  const missing = [];

  for (const kw of jdSet) {
    if (resumeSet.has(kw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const score = jdSet.size > 0 ? matched.length / jdSet.size : 0;
  return { score, matched, missing };
}

// =============================================================================
// Section Detection (bonus points if key resume sections are present)
// =============================================================================

function detectSections(text) {
  const lower = text.toLowerCase();
  return {
    hasSkills:      /skills|technologies|tech stack|proficiencies/i.test(lower),
    hasExperience:  /experience|work history|employment|career/i.test(lower),
    hasEducation:   /education|degree|bachelor|master|phd|university|college/i.test(lower),
    hasProjects:    /project|portfolio|built|developed|created/i.test(lower),
    hasCertifications: /certif|license|aws certified|google certified/i.test(lower),
  };
}

// =============================================================================
// Main Scoring Function — blends keyword + semantic (TF-IDF cosine) scores
// =============================================================================

export function calculateATSScore(jobDescription, resumeText) {
  if (!jobDescription.trim() || !resumeText.trim()) {
    return {
      score: 0,
      keywordScore: 0,
      semanticScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
      sections: {},
      breakdown: [],
    };
  }

  // --- Unigrams for keyword match ---
  const jdTokens     = tokenize(jobDescription);
  const resumeTokens = tokenize(resumeText);

  // --- Ngrams for TF-IDF ---
  const jdNgrams     = extractNgrams(jobDescription);
  const resumeNgrams = extractNgrams(resumeText);

  // --- Keyword match score (exact, same as before) ---
  const { score: kwScore, matched, missing } = keywordMatch(jdTokens, resumeTokens);

  // --- TF-IDF cosine similarity (semantic score) ---
  const idfMap     = buildIDFMap(jdNgrams, resumeNgrams);
  const jdTF       = buildTFVector(jdNgrams);
  const resumeTF   = buildTFVector(resumeNgrams);
  const jdVec      = buildTFIDFVector(jdTF, idfMap);
  const resumeVec  = buildTFIDFVector(resumeTF, idfMap);
  const cosScore   = cosineSimilarity(jdVec, resumeVec);

  // --- Section bonus (up to +5 pts) ---
  const sections  = detectSections(resumeText);
  const sectionBonus =
    (sections.hasSkills        ? 1.5 : 0) +
    (sections.hasExperience    ? 1.5 : 0) +
    (sections.hasEducation     ? 1.0 : 0) +
    (sections.hasProjects      ? 0.5 : 0) +
    (sections.hasCertifications? 0.5 : 0);

  // --- Blend: 40% keyword + 55% semantic + 5% section bonus ---
  const keywordPct  = kwScore * 100;
  const semanticPct = cosScore * 100;
  const rawScore    = (keywordPct * 0.40) + (semanticPct * 0.55) + sectionBonus;
  const score       = Math.min(100, Math.round(rawScore));

  // --- Missing keywords: filter out bigrams, keep readable words, sort by importance ---
  const readableMissing = missing
    .filter(k => !k.includes('_'))            // drop bigrams from badge display
    .sort((a, b) => {
      const aHigh = HIGH_VALUE_TERMS.has(a) ? 1 : 0;
      const bHigh = HIGH_VALUE_TERMS.has(b) ? 1 : 0;
      return bHigh - aHigh;                   // high-value terms first
    })
    .slice(0, 20);

  // --- Score breakdown for UI ---
  const breakdown = [
    { label: 'Keyword Match',       value: Math.round(keywordPct),  weight: '40%' },
    { label: 'Semantic Similarity', value: Math.round(semanticPct), weight: '55%' },
    { label: 'Section Bonus',       value: Math.round(sectionBonus * 20), weight: '5%' },
  ];

  return {
    score,
    keywordScore:  Math.round(keywordPct),
    semanticScore: Math.round(semanticPct),
    matchedKeywords: matched.filter(k => !k.includes('_')).slice(0, 20),
    missingKeywords: readableMissing,
    sections,
    breakdown,
  };
}
