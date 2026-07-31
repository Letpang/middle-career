import React, { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, DollarSign, Filter, ExternalLink, RefreshCw } from 'lucide-react';
import { fetchWork24Jobs, type Work24Job } from '../lib/work24';

const Jobs: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [jobs, setJobs] = useState<Work24Job[]>([]);
  const [total, setTotal] = useState<number>(0);

  const loadJobs = () => {
    setLoading(true);
    setError(undefined);

    fetchWork24Jobs({ display: 30 })
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

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jobTypes = useMemo(() => {
    const uniqueTypes = Array.from(new Set(jobs.map((job) => job.type).filter(Boolean)));
    return ['전체', ...uniqueTypes];
  }, [jobs]);

  const filteredJobs = jobs.filter((job) => {
    const matchesType = selectedType === '전체' || job.type === selectedType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">중장년 맞춤 일자리</h1>
          <p className="page-subtitle">
            고용24 오픈API와 실시간 연동된 채용정보입니다. 단순 업무부터 과거의 커리어 역량을 발휘할 수 있는 전문적인 일자리까지 찾아보세요.
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
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input
                type="text"
                placeholder="직무명, 기업명, 지역을 검색하세요..."
                style={{ width: '100%', paddingLeft: '40px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            <button className="btn btn-secondary" onClick={loadJobs} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
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
      </div>
    </div>
  );
};

export default Jobs;
