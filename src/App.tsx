import { useEffect, useState } from 'react';
import './App.css';
import Home from './pages/Home';
import Education from './pages/Education';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';
import Counseling from './pages/Counseling';
import ChatWidget from './components/ChatWidget';
import { Home as HomeIcon, GraduationCap, Briefcase, User, Link2, MessageCircle, Minus, Plus } from 'lucide-react';

type FontLevel = 0 | 1 | 2;
const FONT_SIZES: Record<FontLevel, string> = { 0: '16px', 1: '18px', 2: '20px' };

function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [fontLevel, setFontLevel] = useState<FontLevel>(0);

  // 글자 크기 조절: 시니어 사용자를 위해 화면 전체 글자 크기를 3단계로 조절합니다.
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontLevel];
  }, [fontLevel]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home setActiveTab={setActiveTab} />;
      case 'education':
        return <Education />;
      case 'jobs':
        return <Jobs />;
      case 'counseling':
        return <Counseling />;
      case 'profile':
        return <Profile />;
      default:
        return <Home setActiveTab={setActiveTab} />;
    }
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="container navbar-container">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
            <Link2 className="logo-icon" />
            <span>커리어 브릿지</span>
          </div>

          <div className="nav-links">
            <button
              className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <HomeIcon size={18} />
              <span>홈</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('jobs')}
            >
              <Briefcase size={18} />
              <span>일자리</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'education' ? 'active' : ''}`}
              onClick={() => setActiveTab('education')}
            >
              <GraduationCap size={18} />
              <span>교육</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'counseling' ? 'active' : ''}`}
              onClick={() => setActiveTab('counseling')}
            >
              <MessageCircle size={18} />
              <span>상담지원</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              <span>프로필</span>
            </button>
          </div>

          {/* 글자 크기 조절 버튼: 눈이 편하도록 화면 글자를 크게/작게 조절할 수 있습니다 */}
          <div className="font-size-control" role="group" aria-label="글자 크기 조절">
            <button
              className="font-size-btn"
              onClick={() => setFontLevel((prev) => (prev > 0 ? ((prev - 1) as FontLevel) : prev))}
              disabled={fontLevel === 0}
              aria-label="글자 작게"
            >
              <Minus size={14} />
            </button>
            <span className="font-size-label">가</span>
            <button
              className="font-size-btn"
              onClick={() => setFontLevel((prev) => (prev < 2 ? ((prev + 1) as FontLevel) : prev))}
              disabled={fontLevel === 2}
              aria-label="글자 크게"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flexGrow: 1 }}>
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-logo">커리어 브릿지 (Career Bridge)</div>
          <p style={{ marginBottom: '10px', fontSize: '0.85rem' }}>인생 2막, 새로운 시작과 도전을 위한 중장년 전문 커리어 매칭 시스템</p>
          <p style={{ fontSize: '0.75rem' }}>© {new Date().getFullYear()} Career Bridge. All rights reserved.</p>
        </div>
      </footer>

      {/* AI 질문창: 모든 화면에서 오른쪽 아래에 떠 있습니다 */}
      <ChatWidget />
    </>
  );
}

export default App;
