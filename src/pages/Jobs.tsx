import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, MapPin, DollarSign, Filter, ExternalLink, RefreshCw } from 'lucide-react';
import { fetchWork24Jobs, type Work24Job } from '../lib/work24';
import { JOB_REFERENCE_SITES } from '../lib/externalSites';

const REGIONS = ['전체', '고양', '파주', '김포'];

const Jobs: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('전체');
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [jobs, setJobs] = useState<Work24Job[]>([]);
  const [total, setTotal] = useState<number>(0);
  const isFirstRun = useRef(true);

  const loadJobs = (opts: { keyword?: string; region?: string } = {}) => {
    setLoading(true);
    setError(undefined);

    const params =
      opts.region && opts.region !== '전체'
        ? { regionKeyword: opts.region, display: 30 }
        : { keyword: opts.keyword, display: 30 };

    fetchWork24Jobs(params)
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setJobs([]);
          setTotal(0);
        } else {
          setJobs(data.items);
          setTotal(data.total);
        }
      })
      .catch((err: Error) => {
        setError(err.message);
        setJobs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  // 처음 화면 진입 시: 최신 채용공고 30건
  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 검색어 입력 시: 화면에 이미 불러온 30건 안에서만 찾지 않고,
  // 고용24 전체 데이터(6만여 건)에서 다시 검색합니다. (입력 후 500ms 뒤 자동 검색)
  // 지역 필터가 켜져 있을 때는 검색어 대신 지역 기준으로만 조회합니다.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (selectedRegion !== '전체') return;
    const timer = setTimeout(() => {
      loadJobs({ keyword: searchQuery.trim() || undefined });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
    setSearchQuery('');
    loadJobs({ region });
  };

  const jobTypes = useMemo(() => {
    const uniqueTypes = Array.from(new Set(jobs.map((job) => job.type).filter(Boolean)));
    return ['전체', ...uniqueTypes];
  }, [jobs]);

  const filteredJobs = jobs.filter((job) => selectedType === '전체' || job.type === selectedType);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">중장년 맞춤 일자리</h1>
          <p className="page-subtitle">
            고용24 오픈API와 실시간 연동된 채용정보입니다. 전국 채용정보는 물론, 고양·파주·김포 지역 일자리도 바로 찾아보세요.
            {!loading && !error && total > 0 && <> (전체 {total.toLocaleString()}건)</>}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '80px' }}>
        {/* Search and Filter Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginBottom: '40px',
          backgroundColor: 'var(--bg-secondary)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}>
          {/* 지역 필터 */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <MapPin size={18} style={{ color: 'var(--text-secondary)', marginRight: '4px' }} />
            {REGIONS.map(region => (
              <button
                key={region}
                onClick={() => handleRegionSelect(region)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  backgroundColor: selectedRegion === region ? 'var(--primary)' : 'var(--bg-tertiary)',
                  color: selectedRegion === region ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                {region}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input
                type="text"
                placeholder={selectedRegion === '전체' ? '직무명, 기업명, 지역을 검색하세요...' : `'전체' 지역을 선택하면 검색할 수 있어요`}
                style={{ width: '100%', paddingLeft: '40px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={selectedRegion !== '전체'}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={18} style={{ color: 'var(--text-secondary)', marginRight: '4px' }} />
              {jobTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    backgroundColor: selectedType === type ? 'var(--primary)' : 'var(--bg-tertiary)',
                    color: selectedType === type ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            채용정보를 불러오는 중입니다...
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--danger)', fontSize: '1.05rem', marginBottom: '16px' }}>
              채용정보를 불러오지 못했습니다. ({error})
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => loadJobs(selectedRegion !== '전체' ? { region: selectedRegion } : { keyword: searchQuery.trim() || undefined })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} /> 다시 시도
            </button>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && (
          filteredJobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredJobs.map(job => (
                <div
                  className="card"
                  key={job.id}
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: '24px',
                    alignItems: 'flex-start',
                    padding: '24px 30px'
                  }}
                >
                  {/* Job Core Details */}
                  <div style={{ flex: '2 1 500px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span className="badge badge-secondary">{job.type}</span>
                      {job.postedDate && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>등록일 {job.postedDate}</span>}
                    </div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '6px', color: 'var(--text-primary)' }}>{job.title}</h3>
                    <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '12px' }}>{job.company}</p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {[job.career, job.education].filter(Boolean).map((tag, idx) => (
                        <span
                          key={idx}
                          className="badge"
                          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Requirements and Compensation */}
                  <div style={{
                    flex: '1 1 250px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    borderLeft: '1px solid var(--border-color)',
                    paddingLeft: '24px',
                    minHeight: '130px',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{job.location}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={16} style={{ color: 'var(--success)' }} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{job.salary}</span>
                      </div>
                    </div>

                    {job.closingDate && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>마감일:</strong> {job.closingDate}
                      </div>
                    )}

                    {job.url ? (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        고용24에서 지원하기 <ExternalLink size={16} />
                      </a>
                    ) : (
                      <button className="btn btn-primary" style={{ width: '100%' }} disabled>
                        지원 링크 준비중
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>해당 조건에 맞는 일자리 공고가 존재하지 않습니다. 다른 검색어로 시도해 보세요.</p>
            </div>
          )
        )}

        {/* 다른 채용사이트 안내 */}
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
            다른 채용사이트도 함께 확인해보세요
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            분야별로 자주 활용되는 전문 채용사이트예요. 눌러서 바로 이동할 수 있어요.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {JOB_REFERENCE_SITES.map((group) => (
              <div key={group.category}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: 'var(--primary)' }}>
                  {group.category}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {group.sites.map((site) => (
                    <a
                      key={site.name}
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card"
                      style={{
                        flex: '1 1 220px',
                        padding: '16px 18px',
                        textDecoration: 'none',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{site.name}</span>
                        <ExternalLink size={15} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{site.desc}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
