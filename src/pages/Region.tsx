import React, { useEffect, useState } from 'react';
import { MapPin, Building2, Phone, Clock, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react';
import { fetchWork24Jobs, type Work24Job } from '../lib/work24';

type RegionKey = '고양' | '파주';

interface RegionInfo {
  description: string;
  centerName: string;
  address: string;
  phone: string;
  hours: string;
  programs: string[];
}

const regionData: Record<RegionKey, RegionInfo> = {
  고양: {
    description: '경기 북부의 중심 도시 고양시의 중장년 취업·교육 지원 정보를 안내합니다.',
    centerName: '고양상공회의소 중장년내일센터',
    address: '경기도 고양시 일산동구 고봉로 32-16, 고양고용복지+센터 1층',
    phone: '031-901-9197',
    hours: '평일 09:00 ~ 18:00',
    programs: [
      '스마트폰 활용 및 디지털 기초 교육 (무료)',
      '시니어 창업 아카데미 (국비지원)',
      '귀농·귀촌 준비 과정',
      '사회적 경제 조직 취업 교육',
    ],
  },
  파주: {
    description: '통일의 관문 파주시의 중장년 취업·교육 지원 정보를 안내합니다.',
    centerName: '파주상공회의소 중장년내일센터',
    address: '파주시 중앙로328 MH타워8층(파주고용복지플러스센터 내)',
    phone: '031-8071-4245',
    hours: '평일 09:00 ~ 17:30',
    programs: [
      '귀농·귀촌 실습 교육 (국비지원)',
      '출판·인쇄 산업 재취업 교육',
      '물류·유통 자격증 취득 과정 (무료)',
      '중장년 1인 창업 컨설팅',
    ],
  },
};

const Region: React.FC = () => {
  const [selected, setSelected] = useState<RegionKey | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [jobs, setJobs] = useState<Work24Job[]>([]);

  const info = selected ? regionData[selected] : null;

  useEffect(() => {
    if (!selected) return;

    let alive = true;
    setLoading(true);
    setError(undefined);

    fetchWork24Jobs({ regionKeyword: selected, display: 4 })
      .then((data) => {
        if (!alive) return;
        if (data.error) {
          setError(data.error);
          setJobs([]);
        } else {
          setJobs(data.items);
        }
      })
      .catch((err: Error) => {
        if (!alive) return;
        setError(err.message);
        setJobs([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [selected]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">지역별 정보</h1>
          <p className="page-subtitle">거주 지역을 선택하면 맞춤 일자리와 교육 프로그램을 안내해 드립니다.</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '80px' }}>
        {/* 지역 선택 버튼 */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '48px' }}>
          {(['고양', '파주'] as RegionKey[]).map((region) => (
            <button
              key={region}
              onClick={() => setSelected(region)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '18px 48px',
                borderRadius: '14px',
                fontSize: '1.2rem',
                fontWeight: '700',
                border: `2px solid ${selected === region ? 'var(--primary)' : 'var(--border-color)'}`,
                backgroundColor: selected === region ? 'var(--primary-light)' : 'var(--bg-secondary)',
                color: selected === region ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: selected === region ? '0 4px 16px rgba(79,70,229,0.15)' : 'var(--card-shadow)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              <MapPin size={22} />
              {region}
            </button>
          ))}
        </div>

        {/* 선택 전 안내 */}
        {!info && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <MapPin size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '1.1rem' }}>위에서 지역을 선택해 주세요.</p>
          </div>
        )}

        {/* 선택 후 정보 */}
        {info && selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* 지역 소개 */}
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1rem' }}>{info.description}</p>

            {/* 지원센터 정보 */}
            <div className="card" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Building2 size={24} />
              </div>
              <div style={{ flex: '1 1 300px' }}>
                <h3 style={{ marginBottom: '12px' }}>{info.centerName}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={15} /> {info.address}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={15} /> {info.phone}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={15} /> {info.hours}
                  </div>
                </div>
              </div>
            </div>

            {/* 교육 프로그램 */}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
                {selected} 교육 프로그램
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {info.programs.map((program, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{ flexDirection: 'row', alignItems: 'center', padding: '16px 20px', gap: '12px' }}
                  >
                    <ChevronRight size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{program}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 지역 일자리 (고용24 실시간 연동) */}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
                {selected} 추천 일자리 <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' }}>(고용24 실시간)</span>
              </h2>

              {loading && (
                <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>채용정보를 불러오는 중입니다...</p>
              )}

              {!loading && error && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ color: 'var(--danger)', marginBottom: '16px' }}>채용정보를 불러오지 못했습니다. ({error})</p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelected(selected === '고양' ? '고양' : '파주')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <RefreshCw size={16} /> 다시 시도
                  </button>
                </div>
              )}

              {!loading && !error && jobs.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  현재 "{selected}" 지역으로 확인되는 채용공고가 없습니다. 잠시 후 다시 확인해 주세요.
                </p>
              )}

              {!loading && !error && jobs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="card"
                      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', padding: '20px 24px', gap: '16px' }}
                    >
                      <div style={{ flex: '1 1 300px' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--primary)' }}>
                          {job.type} · {job.location}
                        </p>
                        <h3 style={{ fontSize: '1.05rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{job.title}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>{job.company}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', color: 'var(--success)', fontSize: '0.95rem' }}>{job.salary}</span>
                        {job.url ? (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ padding: '8px 20px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            지원하기 <ExternalLink size={14} />
                          </a>
                        ) : (
                          <button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }} disabled>
                            지원 링크 준비중
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Region;
