import React, { useState, useEffect } from 'react';
import { usePlannerStore } from '../../stores/plannerStore';
import type { SpendCategory, SelfRating } from '../../types';
import { format, addMonths, subMonths } from 'date-fns';
import { Trash2 } from 'lucide-react';

const CATEGORY_LABELS: Record<SpendCategory, string> = {
  tithe: '십일조',
  donation: '기부·후원',
  saving: '저축',
  personal: '개인 용도/용돈'
};

const RATING_EMOJI: Record<SelfRating, string> = {
  good: '😊',
  ok: '😐',
  bad: '😢'
};

// 항목별 자가평가 버튼 (같은 평가 재클릭 시 해제)
const RatingPicker: React.FC<{
  value?: SelfRating;
  titles: Record<SelfRating, string>;
  onChange: (rating?: SelfRating) => void;
}> = ({ value, titles, onChange }) => (
  <div className="rating-inline-group">
    {(['good', 'ok', 'bad'] as const).map(rate => (
      <button
        key={rate}
        type="button"
        title={titles[rate]}
        onClick={() => onChange(value === rate ? undefined : rate)}
        className={`rating-btn rating-btn-sm ${value === rate ? 'active' : ''}`}
      >
        {RATING_EMOJI[rate]}
      </button>
    ))}
  </div>
);

const SERVING_RATING_TITLES: Record<SelfRating, string> = {
  good: '기쁘게 섬김',
  ok: '대체로 잘함',
  bad: '억지로 함'
};

export const Economy: React.FC = () => {
  const { profile, getEconomyMonth, updateEconomyMonth } = usePlannerStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStr = format(currentDate, 'yyyy-MM');

  const economyData = getEconomyMonth(monthStr);

  const [servingPeriod, setServingPeriod] = useState(economyData.serving.period || '');
  const [reviewSatisfied, setReviewSatisfied] = useState(economyData.review.satisfied || '');
  const [reviewImprove, setReviewImprove] = useState(economyData.review.improve || '');

  useEffect(() => {
    setServingPeriod(economyData.serving.period || '');
    setReviewSatisfied(economyData.review.satisfied || '');
    setReviewImprove(economyData.review.improve || '');
  }, [monthStr, economyData.serving.period, economyData.review.satisfied, economyData.review.improve]);

  const handleSaveTextProps = (field: 'period' | 'satisfied' | 'improve', value: string) => {
    if (field === 'period') {
      updateEconomyMonth(monthStr, {
        serving: { ...economyData.serving, period: value }
      });
    } else {
      updateEconomyMonth(monthStr, {
        review: { ...economyData.review, [field]: value }
      });
    }
  };

  // Serving items
  const [newServingDate, setNewServingDate] = useState('');
  const [newServingContent, setNewServingContent] = useState('');
  const [newServingUnitPrice, setNewServingUnitPrice] = useState(1000);
  const [newServingCount, setNewServingCount] = useState(1);

  const handleAddServingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServingContent.trim()) return;

    const items = [...economyData.serving.items, {
      ...(newServingDate ? { date: newServingDate } : {}),
      content: newServingContent.trim(),
      unitPrice: newServingUnitPrice,
      count: newServingCount
    }];

    updateEconomyMonth(monthStr, {
      serving: { ...economyData.serving, items }
    });

    setNewServingDate('');
    setNewServingContent('');
    setNewServingUnitPrice(1000);
    setNewServingCount(1);
  };

  const handleDeleteServingItem = (idx: number) => {
    const items = economyData.serving.items.filter((_, i) => i !== idx);
    updateEconomyMonth(monthStr, {
      serving: { ...economyData.serving, items }
    });
  };

  const handleServingRating = (idx: number, rating?: SelfRating) => {
    const items = economyData.serving.items.map((item, i) =>
      i === idx ? { ...item, rating } : item
    );
    updateEconomyMonth(monthStr, {
      serving: { ...economyData.serving, items }
    });
  };

  // Spending Plan
  const [newPlanDate, setNewPlanDate] = useState('');
  const [newPlanLabel, setNewPlanLabel] = useState('');
  const [newPlanCategory, setNewPlanCategory] = useState<SpendCategory>(profile.mode === 'faith' ? 'tithe' : 'donation');
  const [newPlanAmount, setNewPlanAmount] = useState(1000);

  const handleAddPlanItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanLabel.trim()) return;

    const spendingPlan = [...economyData.spendingPlan, {
      ...(newPlanDate ? { date: newPlanDate } : {}),
      category: newPlanCategory,
      label: newPlanLabel.trim(),
      amount: newPlanAmount
    }];

    updateEconomyMonth(monthStr, { spendingPlan });
    setNewPlanDate('');
    setNewPlanLabel('');
    setNewPlanAmount(1000);
  };

  const handleDeletePlanItem = (idx: number) => {
    const spendingPlan = economyData.spendingPlan.filter((_, i) => i !== idx);
    updateEconomyMonth(monthStr, { spendingPlan });
  };

  // Spending Actual
  const [newActualLabel, setNewActualLabel] = useState('');
  const [newActualCategory, setNewActualCategory] = useState<SpendCategory>(profile.mode === 'faith' ? 'tithe' : 'donation');
  const [newActualAmount, setNewActualAmount] = useState(1000);
  const [newActualDate, setNewActualDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleAddActualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActualLabel.trim()) return;

    const spendingActual = [...economyData.spendingActual, {
      date: newActualDate,
      category: newActualCategory,
      label: newActualLabel.trim(),
      amount: newActualAmount
    }];

    spendingActual.sort((a, b) => a.date.localeCompare(b.date));

    updateEconomyMonth(monthStr, { spendingActual });
    setNewActualLabel('');
    setNewActualAmount(1000);
  };

  const handleDeleteActualItem = (idx: number) => {
    const spendingActual = economyData.spendingActual.filter((_, i) => i !== idx);
    updateEconomyMonth(monthStr, { spendingActual });
  };

  // Calculations
  const incomeTotal = economyData.serving.items.reduce((sum, item) => sum + (item.unitPrice * item.count), 0);
  const planTotal = economyData.spendingPlan.reduce((sum, item) => sum + item.amount, 0);
  const actualTotal = economyData.spendingActual.reduce((sum, item) => sum + item.amount, 0);
  const balance = incomeTotal - actualTotal;

  const availableCategories = (Object.keys(CATEGORY_LABELS) as SpendCategory[]).filter(
    cat => profile.mode === 'faith' || cat !== 'tithe'
  );

  return (
    <div className="economy-container">
      {/* 1. Header Navigation */}
      <div className="card economy-header-card flex-between" style={{ borderBottom: '3px solid var(--line)', marginBottom: '0' }}>
        <div className="nav-month">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="btn-icon">◀</button>
          <h2 style={{ display: 'inline', margin: '0 16px', fontFamily: 'var(--font-num)' }}>
            {format(currentDate, 'yyyy년 M월')} 경제 훈련
          </h2>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="btn-icon">▶</button>
        </div>
        <div className="economy-summary-badges">
          <span className="summary-badge inc">수입: {incomeTotal.toLocaleString()}원</span>
          <span className="summary-badge exp">지출: {actualTotal.toLocaleString()}원</span>
          <span className="summary-badge bal">잔액: {balance.toLocaleString()}원</span>
        </div>
      </div>

      {/* Part 1: Serving Income Table */}
      <div className="card serving-training-card">
        <div className="card-header flex-between" style={{ borderBottom: 'none' }}>
          <div>
            <h3>1단계: 필요를 섬기는 훈련 (수입 창출)</h3>
            <p className="text-secondary text-xs" style={{ marginTop: '4px' }}>내 재능과 수고를 통해 얻은 정당한 대가를 기록합니다.</p>
          </div>
          <div>
            <label htmlFor="period-input" style={{ fontSize: '12px', color: 'var(--soft)' }}>훈련 기간: </label>
            <input
              id="period-input"
              type="text"
              placeholder="예: 7월 한 달간"
              value={servingPeriod}
              onChange={(e) => setServingPeriod(e.target.value)}
              onBlur={() => handleSaveTextProps('period', servingPeriod)}
              className="period-inline-input"
            />
          </div>
        </div>

        <div className="card-body" style={{ padding: '12px 0 0' }}>
          <table className="economy-table mb-12">
            <thead>
              <tr>
                <th className="w-15">날짜</th>
                <th>섬김 및 수고 내용</th>
                <th className="w-20 text-right">단가</th>
                <th className="w-15 text-center">횟수</th>
                <th className="w-20 text-right">금액</th>
                <th className="text-center" title="😊 기쁘게 섬김 · 😐 대체로 잘함 · 😢 억지로 함">성실도</th>
                <th className="w-10 no-print">삭제</th>
              </tr>
            </thead>
            <tbody>
              {economyData.serving.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-sub text-center">기록된 수입 활동이 없습니다.</td>
                </tr>
              ) : (
                economyData.serving.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-secondary">{item.date ? item.date.slice(5) : '－'}</td>
                    <td>{item.content}</td>
                    <td className="text-right">{item.unitPrice.toLocaleString()}원</td>
                    <td className="text-center">{item.count}회</td>
                    <td className="text-right font-medium">{(item.unitPrice * item.count).toLocaleString()}원</td>
                    <td className="text-center">
                      <RatingPicker
                        value={item.rating}
                        titles={SERVING_RATING_TITLES}
                        onChange={(rating) => handleServingRating(idx, rating)}
                      />
                    </td>
                    <td className="no-print text-center">
                      <button type="button" onClick={() => handleDeleteServingItem(idx)} className="btn-delete-sm">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              <tr className="table-total-row">
                <td colSpan={4} className="text-right">수입 합계:</td>
                <td className="text-right" style={{ color: 'var(--accent)' }}>{incomeTotal.toLocaleString()}원</td>
                <td></td>
                <td className="no-print"></td>
              </tr>
            </tbody>
          </table>

          {/* Add form */}
          <form onSubmit={handleAddServingItem} className="form-inline mb-16 no-print">
            <input
              type="date"
              value={newServingDate}
              onChange={(e) => setNewServingDate(e.target.value)}
              style={{ width: '140px' }}
              title="날짜 (선택)"
            />
            <input
              type="text"
              placeholder="섬김 수고 내용 (예: 거실 청소 돕기)"
              value={newServingContent}
              onChange={(e) => setNewServingContent(e.target.value)}
              className="flex-1"
              required
            />
            <input
              type="number"
              value={newServingUnitPrice}
              onChange={(e) => setNewServingUnitPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
              style={{ width: '100px' }}
              min="0"
              required
            />
            <input
              type="number"
              value={newServingCount}
              onChange={(e) => setNewServingCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{ width: '80px' }}
              min="1"
              required
            />
            <button type="submit" className="btn btn-primary">+</button>
          </form>

          {/* Rating legend */}
          <div style={{ borderTop: '2px dashed var(--line)', paddingTop: '10px', marginTop: '12px', fontSize: '12px', color: 'var(--soft)', textAlign: 'right' }}>
            항목별 활동 성실도 자가평가 · 😊 기쁘게 섬김 &nbsp; 😐 대체로 잘함 &nbsp; 😢 억지로 함
          </div>
        </div>
      </div>

      {/* Part 2: Spending cols (Plan & Actual) */}
      <div className="economy-two-cols">
        {/* Budget Plan */}
        <div className="card spending-col-card">
          <div className="card-header">
            <h3>2단계: 돈을 기획하는 훈련 (지출 계획)</h3>
            <span className="header-total">예산 합계: {planTotal.toLocaleString()}원</span>
          </div>
          <div className="card-body" style={{ padding: '12px 0 0' }}>
            <table className="economy-table table-sm mb-12">
              <thead>
                <tr>
                  <th className="w-15">예정일</th>
                  <th>구분</th>
                  <th>명목</th>
                  <th className="text-right">금액</th>
                  <th className="w-10 no-print">삭제</th>
                </tr>
              </thead>
              <tbody>
                {economyData.spendingPlan.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-sub text-center">수립된 계획이 없습니다.</td>
                  </tr>
                ) : (
                  economyData.spendingPlan.map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-secondary">{item.date ? item.date.slice(5) : '－'}</td>
                      <td><span className={`cat-tag cat-${item.category}`}>{CATEGORY_LABELS[item.category]}</span></td>
                      <td>{item.label}</td>
                      <td className="text-right">{item.amount.toLocaleString()}원</td>
                      <td className="no-print text-center">
                        <button type="button" onClick={() => handleDeletePlanItem(idx)} className="btn-delete-sm">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <form onSubmit={handleAddPlanItem} className="form-inline no-print">
              <input
                type="date"
                value={newPlanDate}
                onChange={(e) => setNewPlanDate(e.target.value)}
                style={{ width: '130px' }}
                title="예정일 (선택)"
              />
              <select
                value={newPlanCategory}
                onChange={(e) => setNewPlanCategory(e.target.value as SpendCategory)}
                style={{ width: '90px' }}
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="지출 명목"
                value={newPlanLabel}
                onChange={(e) => setNewPlanLabel(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <input
                type="number"
                value={newPlanAmount}
                onChange={(e) => setNewPlanAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                style={{ width: '90px' }}
                min="0"
                required
              />
              <button type="submit" className="btn btn-primary">+</button>
            </form>
          </div>
        </div>

        {/* Actual Spending */}
        <div className="card spending-col-card">
          <div className="card-header">
            <h3>3단계: 돈을 집행하는 훈련 (지출 내역)</h3>
            <span className="header-total">지출 합계: {actualTotal.toLocaleString()}원</span>
          </div>
          <div className="card-body" style={{ padding: '12px 0 0' }}>
            <table className="economy-table table-sm mb-12">
              <thead>
                <tr>
                  <th className="w-20">날짜</th>
                  <th>구분</th>
                  <th>내역</th>
                  <th className="text-right">금액</th>
                  <th className="w-10 no-print">삭제</th>
                </tr>
              </thead>
              <tbody>
                {economyData.spendingActual.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-sub text-center">지출 내역이 없습니다.</td>
                  </tr>
                ) : (
                  economyData.spendingActual.map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-secondary">{item.date.slice(5)}</td>
                      <td><span className={`cat-tag cat-${item.category}`}>{CATEGORY_LABELS[item.category]}</span></td>
                      <td>{item.label}</td>
                      <td className="text-right">{item.amount.toLocaleString()}원</td>
                      <td className="no-print text-center">
                        <button type="button" onClick={() => handleDeleteActualItem(idx)} className="btn-delete-sm">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <form onSubmit={handleAddActualItem} className="form-grid no-print">
              <div className="grid-row">
                <input
                  type="date"
                  value={newActualDate}
                  onChange={(e) => setNewActualDate(e.target.value)}
                  style={{ flex: 1 }}
                  required
                />
                <select
                  value={newActualCategory}
                  onChange={(e) => setNewActualCategory(e.target.value as SpendCategory)}
                  style={{ flex: 1 }}
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
              <div className="grid-row">
                <input
                  type="text"
                  placeholder="실제 지출 명목"
                  value={newActualLabel}
                  onChange={(e) => setNewActualLabel(e.target.value)}
                  style={{ flex: 1 }}
                  required
                />
                <input
                  type="number"
                  value={newActualAmount}
                  onChange={(e) => setNewActualAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  style={{ width: '90px' }}
                  min="0"
                  required
                />
                <button type="submit" className="btn btn-primary">지출</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Part 3: Review */}
      <div className="card economy-review-card">
        <div className="card-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
          <h3>4단계: 경제활동 성찰 및 회고</h3>
        </div>
        <div className="card-body form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '12px 0 0' }}>
          <div className="form-group">
            <label htmlFor="satisfied-box">이번 달 경제 활동 중 잘했거나 만족했던 점은 무엇인가요?</label>
            <textarea
              id="satisfied-box"
              placeholder="예: 십일조와 후원금을 계획대로 보냈고, 개인 지출에서 과도한 군것질을 참았다."
              value={reviewSatisfied}
              onChange={(e) => setReviewSatisfied(e.target.value)}
              onBlur={() => handleSaveTextProps('satisfied', reviewSatisfied)}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="improve-box">다음 달에 더 잘하고 개선하고 싶은 점은 무엇인가요?</label>
            <textarea
              id="improve-box"
              placeholder="예: 충동구매를 방지하기 위해 다음 달 지출 계획서 내용을 좀 더 꼼꼼하게 작성하겠다."
              value={reviewImprove}
              onChange={(e) => setReviewImprove(e.target.value)}
              onBlur={() => handleSaveTextProps('improve', reviewImprove)}
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
