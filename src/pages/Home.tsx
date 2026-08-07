import React, { useEffect, useState } from 'react';
import { Briefcase, GraduationCap, MessageCircle, UserCheck, ArrowRight, Award, Compass, Heart, MapPin, ExternalLink } from 'lucide-react';
import { fetchWork24Jobs, type Work24Job } from '../lib/work24';

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

interface JobsPreviewState {
  loading: boolean;
  total: number;
  items: Work24Job[];
  error?: string;
}

const Home: React.FC<HomeProps> = ({ setActiveTab }) => {
  const [jobsPreview, setJobsPreview] = useState<JobsPreviewState>({
    loading: true,
    total: 0,
    items: [],
  });

  useEffect(() => {
    let alive = true;

    fetchWork24Jobs({ display: 3 })
      .then((data) => {
        if (!alive) return;
        setJobsPreview({ loading: false, total: data.total, items: data.items, error: data.error });
      })
      .catch((err: Error) => {
        if (!alive) return;
        setJobsPreview({ loading: false, total: 0, items: [], error: err.message });
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <span className="hero-tag">4060 세대의 새로운 도약</span>
          <h1>
            인생 2막의 든든한 디딤돌<br />
            <span>중장년 커리어 브릿지</span>
          </h1>
          <p className="hero-subtitle">
            오랜 시간 쌓아오신 소중한 경험과 지혜가 새로운 기회로 이어지도록,
            실시간 채용정보부터 맞춤 교육, 1:1 상담까지 한 곳에서 도와드립니다.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setActiveTab('jobs')}>
              맞춤 일자리 찾기
              <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab('counseling')}>
              1:1 상담 신청하기
            </button>
          </div>
        </div>
      </section>

      {/* Main Services Grid */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="section-title">핵심 제공 서비스</h2>
            <p className="section-desc">성공적인 재취업 준비를 위한 4가지 서비스</p>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {/* Card 1 */}
            <div className="card">
              <div className="card-icon-container">
                <Briefcase size={24} />
              </div>
              <h3>실시간 일자리 정보</h3>
              <p>
                고용24 공공 채용정보와 실시간으로 연동하여, 단순 업무부터 그동안의 전문 경력을 이어갈 수 있는 양질의 일자리까지 안내합니다.
              </p>
              <button
                className="card-link"
                onClick={() => setActiveTab('jobs')}
                style={{ alignSelf: 'flex-start', color: 'var(--primary)', fontWeight: '600' }}
              >
                일자리 찾기 <ArrowRight />
              </button>
            </div>

            {/* Card 2 */}
            <div className="card">
              <div className="card-icon-container">
                <GraduationCap size={24} />
              </div>
              <h3>맞춤형 역량 교육</h3>
              <p>
                디지털 기본 역량부터 재취업 필수 전문 과정까지, 중장년층이 빠르게 적응하고 성과를 낼 수 있는 교육 과정을 제안합니다.
              </p>
              <button
                className="card-link"
                onClick={() => setActiveTab('education')}
                style={{ alignSelf: 'flex-start', color: 'var(--primary)', fontWeight: '600' }}
              >
                교육 과정 보기 <ArrowRight />
              </button>
            </div>

            {/* Card 3 */}
            <div className="card">
              <div className="card-icon-container">
                <MessageCircle size={24} />
              </div>
              <h3>1:1 커리어 상담지원</h3>
              <p>
                이력서 클리닉, 면접 준비, 진로 고민까지 전문 상담사와 함께 이야기 나누고 나에게 맞는 재취업 전략을 세워 드립니다.
              </p>
              <button
                className="card-link"
                onClick={() => setActiveTab('counseling')}
                style={{ alignSelf: 'flex-start', color: 'var(--primary)', fontWeight: '600' }}
              >
                상담 신청하기 <ArrowRight />
              </button>
            </div>

            {/* Card 4 */}
            <div className="card">
              <div className="card-icon-container">
                <UserCheck size={24} />
              </div>
              <h3>커리어 프로필 관리</h3>
              <p>
                이름, 경력, 보유 기술을 한 번만 등록해 두면 나에게 맞는 일자리와 교육을 더 쉽게 찾아볼 수 있습니다.
              </p>
              <button
                className="card-link"
                onClick={() => setActiveTab('profile')}
                style={{ alignSelf: 'flex-start', color: 'var(--primary)', fontWeight: '600' }}
              >
                프로필 작성하기 <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Jobs Preview (고용24 실시간 채용정보) */}
      {!jobsPreview.error && (jobsPreview.loading || jobsPreview.items.length > 0) && (
        <section style={{ padding: '20px 0 60px' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 className="section-title">지금 새로 올라온 채용공고</h2>
              <p className="section-desc">고용24 오픈API로 실시간 연동된 최신 채용정보입니다</p>
            </div>

            {jobsPreview.loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>채용정보를 불러오는 중입니다...</p>
            ) : (
              <div className="grid">
                {jobsPreview.items.map((job) => (
                  <div className="card" key={job.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="badge badge-secondary">{job.type}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem' }}>{job.title}</h3>
                    <p style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '8px' }}>{job.company}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>
                      <MapPin size={14} />
                      <span>{job.location}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{job.salary}</p>
                    {job.url ? (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-link"
                        style={{ alignSelf: 'flex-start', color: 'var(--primary)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        고용24에서 보기 <ExternalLink size={16} />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button className="btn btn-secondary" onClick={() => setActiveTab('jobs')}>
                전체 일자리 보기 <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Values Section */}
      <section style={{ padding: '60px 0', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center' }}>
            <div style={{ flex: '1 1 400px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>우리의 가치</span>
              <h2 style={{ fontSize: '2rem', fontWeight: '700', marginTop: '10px', marginBottom: '20px', lineHeight: '1.3' }}>
                경험은 가장 큰 자산이자<br />사회의 가장 밝은 빛입니다.
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                중장년 세대의 지혜는 새로운 세대와 사회에 귀중한 나침반이 됩니다. 커리어 브릿지는 이 연결고리가 끊어지지 않도록 단단한 다리가 되어 드리겠습니다.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: 'var(--success)', marginTop: '4px' }}><Award size={20} /></div>
                  <div>
                    <h4 style={{ fontWeight: '600', color: 'var(--text-primary)' }}>전문 경력의 가치 재발견</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>은퇴 이후에도 전문성을 살려 컨설턴트 및 멘토로 활약하도록 돕습니다.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: 'var(--secondary)', marginTop: '4px' }}><Compass size={20} /></div>
                  <div>
                    <h4 style={{ fontWeight: '600', color: 'var(--text-primary)' }}>새로운 도전 지원</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>디지털 도구 및 최신 기술 교육을 통해 누구나 쉽게 적응할 수 있도록 지원합니다.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: 'var(--danger)', marginTop: '4px' }}><Heart size={20} /></div>
                  <div>
                    <h4 style={{ fontWeight: '600', color: 'var(--text-primary)' }}>사람 중심의 상담</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>혼자 고민하지 않도록, 전문 상담사가 눈높이에 맞춰 함께 길을 찾아 드립니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--bg-primary)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>간편 연결 정보</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>지금 바로 시작해 보세요</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>진행 중인 무료 교육</span>
                <span className="badge badge-primary">12개 코스</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>추천 채용 중 일자리 (고용24 실시간)</span>
                <span className="badge badge-secondary">
                  {jobsPreview.loading
                    ? '불러오는 중...'
                    : jobsPreview.error
                      ? '정보 준비중'
                      : `${jobsPreview.total.toLocaleString()}개 채용공고`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>1:1 상담 소요 시간</span>
                <span className="badge badge-accent" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)' }}>약 30분</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
                onClick={() => setActiveTab('counseling')}
              >
                지금 상담 신청하기
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
