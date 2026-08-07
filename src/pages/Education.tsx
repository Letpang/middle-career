import React from 'react';
import { ExternalLink } from 'lucide-react';
import { EDUCATION_REFERENCE_SITES } from '../lib/externalSites';

const Education: React.FC = () => {
  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">재취업 & 역량 교육</h1>
          <p className="page-subtitle">
            고양·파주·김포 시청과 대학이 직접 운영하는 평생학습·재취업 교육 프로그램을 안내해 드립니다.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {EDUCATION_REFERENCE_SITES.map((group) => (
            <div key={group.category}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px', color: 'var(--primary)' }}>
                {group.category}
              </h2>
              <div className="grid">
                {group.sites.map((site) => (
                  <a
                    key={site.name}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card"
                    style={{ textDecoration: 'none', gap: '8px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.05rem' }}>{site.name}</span>
                      <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{site.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Education;
