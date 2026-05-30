import ResumeMatcher from './components/ResumeMatcher';

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Resume Matcher</h1>
        <p>Analyze your resume against any job description instantly.</p>
      </header>
      
      <main>
        <ResumeMatcher />
      </main>
    </div>
  );
}

export default App;
