import React, { useEffect, useState } from 'react';
import { MessageCircle, Phone, Video, Users, CheckCircle2, ChevronDown, PhoneCall, Send } from 'lucide-react';

interface CounselingRequest {
  name: string;
  phone: string;
  topic: string;
  method: string;
  preferredTime: string;
  message: string;
  submittedAt: string;
}

const TOPICS = ['이력서 · 자기소개서 클리닉', '면접 준비', '진로 · 재취업 방향 설계', '창업 상담', '디지털 역량 상담', '기타 고민 상담'];
const METHODS = [
  { value: '전화상담', icon: Phone, desc: '편하신 시간에 전화로 상담해 드립니다' },
  { value: '방문상담', icon: Users, desc: '센터에 직접 방문하여 상담받으실 수 있습니다' },
  { value: '화상상담', icon: Video, desc: '집에서 화상으로 편하게 상담받으실 수 있습니다' },
];

const FAQS = [
  {
    q: '상담은 무료인가요?',
    a: '네, 커리어 브릿지의 모든 1:1 상담은 무료로 제공됩니다. 부담 없이 신청해 주세요.',
  },
  {
    q: '상담 신청 후 얼마나 기다려야 하나요?',
    a: '신청서 접수 후 영업일 기준 1~2일 이내에 담당 상담사가 입력하신 연락처로 직접 연락드립니다.',
  },
  {
    q: '컴퓨터 사용이 서툴러도 신청할 수 있나요?',
    a: '물론입니다. 전화상담이나 방문상담을 선택하시면 화면 조작 없이도 편하게 상담받으실 수 있습니다. 도움이 필요하시면 지역센터로 바로 전화 주셔도 됩니다.',
  },
  {
    q: '상담은 몇 번까지 받을 수 있나요?',
    a: '횟수 제한은 없습니다. 이력서 점검, 면접 준비 등 필요하실 때마다 여러 번 신청하실 수 있습니다.',
  },
];

const STORAGE_KEY = 'career_bridge_counseling_requests';

const Counseling: React.FC = () => {
  const [form, setForm] = useState<Omit<CounselingRequest, 'submittedAt'>>({
    name: '',
    phone: '',
    topic: TOPICS[0],
    method: METHODS[0].value,
    preferredTime: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [requestCount, setRequestCount] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as CounselingRequest[];
      setRequestCount(saved.length);
    } catch {
      setRequestCount(0);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as CounselingRequest[];
      const next = [...saved, { ...form, submittedAt: new Date().toISOString() }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setRequestCount(next.length);
    } catch {
      // localStorage 저장 실패 시에도 접수 화면은 보여줍니다.
    }
    setSubmitted(true);
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', topic: TOPICS[0], method: METHODS[0].value, preferredTime: '', message: '' });
    setSubmitted(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">1:1 커리어 상담지원</h1>
          <p className="page-subtitle">
            혼자 고민하지 마세요. 이력서, 면접, 진로 방향까지 전문 상담사가 눈높이에 맞춰 함께 이야기 나눕니다. 모든 상담은 무료입니다.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '80px' }}>
        {/* 상담 절차 안내 */}
        <div className="grid" style={{ marginBottom: '50px' }}>
          {[
            { step: '1', title: '신청서 작성', desc: '아래 신청 폼에 원하시는 상담 분야와 방식을 입력해 주세요.' },
            { step: '2', title: '상담사 배정 및 연락', desc: '영업일 기준 1~2일 내 담당 상담사가 직접 연락드립니다.' },
            { step: '3', title: '1:1 맞춤 상담 진행', desc: '전화, 방문, 화상 중 선택하신 방식으로 약 30분간 상담을 진행합니다.' },
            { step: '4', title: '맞춤 정보 안내', desc: '상담 내용을 바탕으로 알맞은 일자리와 교육 과정을 추천해 드립니다.' },
          ].map((s) => (
            <div className="card" key={s.step}>
              <div className="card-icon-container" style={{ fontWeight: 800, fontSize: '1.1rem' }}>{s.step}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start' }}>
          {/* 신청 폼 */}
          <div
            style={{
              flex: '2 1 480px',
              backgroundColor: 'var(--bg-secondary)',
              padding: '36px 30px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            {!submitted ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <MessageCircle size={22} style={{ color: 'var(--primary)' }} />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>상담 신청서</h2>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>이름</label>
                      <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="홍길동" required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>연락처</label>
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" required />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>상담 분야</label>
                    <select name="topic" value={form.topic} onChange={handleChange}>
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>상담 방식</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                      {METHODS.map((m) => {
                        const Icon = m.icon;
                        const active = form.method === m.value;
                        return (
                          <button
                            type="button"
                            key={m.value}
                            onClick={() => setForm((prev) => ({ ...prev, method: m.value }))}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              gap: '8px',
                              padding: '14px',
                              borderRadius: '10px',
                              border: `2px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                              backgroundColor: active ? 'var(--primary-light)' : 'var(--bg-primary)',
                              textAlign: 'left',
                            }}
                          >
                            <Icon size={20} style={{ color: active ? 'var(--primary)' : 'var(--text-secondary)' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: active ? 'var(--primary)' : 'var(--text-primary)' }}>{m.value}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>희망 상담 시간대</label>
                    <input
                      type="text"
                      name="preferredTime"
                      value={form.preferredTime}
                      onChange={handleChange}
                      placeholder="예: 평일 오전, 화요일 오후 2시 이후 등"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>상담받고 싶은 내용</label>
                    <textarea
                      name="message"
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="현재 고민이나 궁금하신 점을 편하게 적어 주세요."
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                    <Send size={18} />
                    상담 신청하기
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>
                  상담 신청이 접수되었습니다
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  {form.name || '고객'}님, 신청해 주셔서 감사합니다. 영업일 기준 1~2일 이내에{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{form.phone}</strong>로 담당 상담사가 연락드리겠습니다.
                </p>
                <button className="btn btn-secondary" onClick={resetForm}>다른 상담 추가로 신청하기</button>
              </div>
            )}
          </div>

          {/* 사이드 정보 */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              className="card"
              style={{ backgroundColor: 'var(--primary-light)', border: 'none' }}
            >
              <div className="card-icon-container" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <PhoneCall size={22} />
              </div>
              <h3>급하신가요? 바로 전화 주세요</h3>
              <p>인터넷 신청이 어려우시면 아래 번호로 바로 전화 주셔도 상담 예약을 도와드립니다.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)' }}>
                <span>고양센터 031-901-9197</span>
                <span>파주센터 031-8071-4245</span>
              </div>
            </div>

            {requestCount > 0 && (
              <div className="card">
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  이 브라우저에서 지금까지 <strong style={{ color: 'var(--primary)' }}>{requestCount}건</strong>의 상담을 신청하셨습니다.
                </p>
              </div>
            )}

            {/* FAQ */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)' }}>자주 묻는 질문</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="card"
                      style={{ padding: '16px 20px', cursor: 'pointer' }}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{faq.q}</span>
                        <ChevronDown
                          size={18}
                          style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}
                        />
                      </div>
                      {isOpen && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: '1.6' }}>{faq.a}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Counseling;
