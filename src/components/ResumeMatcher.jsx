import { useState } from 'react';
import { calculateATSScore } from '../utils/scoring';

export default function ResumeMatcher() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText]         = useState('');
  const [results, setResults]               = useState(null);
  const [isCalculating, setIsCalculating]   = useState(false);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const scoreData = calculateATSScore(jobDescription, resumeText);
      setResults(scoreData);
      setIsCalculating(false);
    }, 800);
  };

  const getScoreClass = (score) => {
    if (score >= 75) return 'excellent';
    if (score >= 45) return 'good';
    return 'poor';
  };

  const getScoreMessage = (score) => {
    if (score >= 75) return 'Strong match! Your resume aligns very well with this role.';
    if (score >= 45) return 'Decent match — adding a few missing keywords should boost your score significantly.';
    return 'Low match. Tailor your resume more closely to the job description to improve your ATS chances.';
  };

  const getScoreTitle = (score) => {
    if (score >= 75) return 'Outstanding!';
    if (score >= 45) return 'Getting There!';
    return 'Needs Work';
  };

  return (
    <div className="glass-panel">
      <div className="matcher-grid">
        <div className="input-group">
          <label htmlFor="jd-input">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Job Description
          </label>
          <textarea
            id="jd-input"
            placeholder="Paste the target job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="resume-input">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Resume Text
          </label>
          <textarea
            id="resume-input"
            placeholder="Paste your resume content here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleCalculate}
        disabled={!jobDescription.trim() || !resumeText.trim() || isCalculating}
      >
        {isCalculating ? (
          <>
            <span className="spinner" />
            Analyzing with ML Model...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
            Analyze Resume (ML Score)
          </>
        )}
      </button>

      {results && (
        <div className="results-section">

          {/* ── Main Score ── */}
          <div className="score-display">
            <div className={`score-circle ${getScoreClass(results.score)}`}>
              <span className="score-value">{results.score}%</span>
              <span className="score-label">ATS Score</span>
            </div>
            <div className="score-text">
              <h3>{getScoreTitle(results.score)}</h3>
              <p>{getScoreMessage(results.score)}</p>
              <div className="ml-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                Powered by TF-IDF · Cosine Similarity · Bigram Phrases
              </div>
            </div>
          </div>

          {/* ── Score Breakdown ── */}
          <div className="breakdown-card">
            <h4 className="breakdown-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Score Breakdown
            </h4>
            <div className="breakdown-bars">
              {results.breakdown.map((item, i) => (
                <div key={i} className="breakdown-row">
                  <div className="breakdown-meta">
                    <span className="breakdown-label">{item.label}</span>
                    <span className="breakdown-weight">{item.weight}</span>
                    <span className="breakdown-val">{item.value}%</span>
                  </div>
                  <div className="breakdown-track">
                    <div
                      className="breakdown-fill"
                      style={{
                        width: `${item.value}%`,
                        animationDelay: `${i * 0.15}s`,
                        background: i === 0
                          ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                          : i === 1
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Matched Keywords ── */}
          {results.matchedKeywords.length > 0 && (
            <div className="keywords-card matched-card">
              <h4>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Matched Keywords ({results.matchedKeywords.length})
              </h4>
              <div className="keyword-badges">
                {results.matchedKeywords.map((kw, i) => (
                  <span key={i} className="badge badge-match">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Missing Keywords ── */}
          {results.missingKeywords.length > 0 && (
            <div className="keywords-card missing-card">
              <h4>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Suggested Keywords to Add ({results.missingKeywords.length})
              </h4>
              <div className="keyword-badges">
                {results.missingKeywords.map((kw, i) => (
                  <span key={i} className="badge badge-missing">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Section Detection ── */}
          <div className="sections-card">
            <h4>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Resume Sections Detected
            </h4>
            <div className="sections-grid">
              {[
                { key: 'hasSkills',          label: 'Skills' },
                { key: 'hasExperience',      label: 'Experience' },
                { key: 'hasEducation',       label: 'Education' },
                { key: 'hasProjects',        label: 'Projects' },
                { key: 'hasCertifications',  label: 'Certifications' },
              ].map(({ key, label }) => (
                <div key={key} className={`section-pill ${results.sections[key] ? 'detected' : 'missing'}`}>
                  {results.sections[key]
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                  {label}
                </div>
              ))}
            </div>
          </div>

          {results.missingKeywords.length === 0 && results.score > 0 && (
            <div className="all-good-banner">
              🎉 All key terms from the job description are present in your resume!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
