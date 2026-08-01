import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Problem, Subject, TestPaper } from '../storage/models';
import { TestBuilder } from '../features/test-builder/TestBuilder';
import { PrintPreview } from '../print/PrintPreview';
import './navigation.css';
import './ui-polish.css';

type Screen = 'home' | 'subject-select' | 'test-builder' | 'problem-editor' | 'problem-list' | 'test-list' | 'print-preview';

const emptyProblem = (): Problem => ({
  id: '',
  title: '',
  subject: '数学I',
  unit: '',
  format: '記述',
  questionText: '',
  answerText: '',
  explanation: '',
  defaultPoints: 5,
  createdAt: '',
  updatedAt: '',
});

const screenLabels: Record<Screen, string> = {
  home: 'ホーム',
  'subject-select': 'テスト作成',
  'test-builder': '小テスト作成',
  'problem-editor': 'オリジナル問題作成',
  'problem-list': '保存済みオリジナル問題',
  'test-list': '作成済みテスト',
  'print-preview': '印刷プレビュー',
};

function formatDate(value: string) {
  if (!value) return '作成直後';
  return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function DemoApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [tests, setTests] = useState<TestPaper[]>([]);
  const [editing, setEditing] = useState<Problem>(emptyProblem);
  const [activeTest, setActiveTest] = useState<TestPaper>();
  const [subject, setSubject] = useState<Subject>('数学I');
  const [filter, setFilter] = useState<'すべて' | Subject>('すべて');
  const [message, setMessage] = useState('');

  const loadProblems = async () => setProblems(await window.desktop.problems.list());
  const loadTests = async () => setTests(await window.desktop.tests.list());

  useEffect(() => {
    void Promise.all([loadProblems(), loadTests()]);
  }, []);

  const navigate = (next: Screen) => {
    setMessage('');
    setScreen(next);
  };

  const visibleProblems = useMemo(
    () => problems.filter((problem) => filter === 'すべて' || problem.subject === filter),
    [problems, filter],
  );

  const startProblem = () => {
    setEditing(emptyProblem());
    navigate('problem-editor');
  };

  const saveProblem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing.title.trim() || !editing.unit.trim() || !editing.questionText.trim() || !editing.answerText.trim()) {
      setMessage('タイトル、単元、問題文、正答を入力してください。');
      return;
    }

    await window.desktop.problems.save({
      ...editing,
      title: editing.title.trim(),
      unit: editing.unit.trim(),
    });
    await loadProblems();
    setMessage('問題を保存しました。');
    setScreen('problem-list');
  };

  const deleteProblem = async (problem: Problem) => {
    if (!window.confirm('「' + problem.title + '」を削除しますか？')) return;
    try {
      await window.desktop.problems.delete(problem.id);
      await loadProblems();
      setMessage('問題を削除しました。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '問題を削除できませんでした。');
    }
  };

  const deleteTest = async (test: TestPaper) => {
    if (!window.confirm('「' + test.name + '」を削除しますか？')) return;
    await window.desktop.tests.delete(test.id);
    if (activeTest?.id === test.id) setActiveTest(undefined);
    await loadTests();
    setMessage('テストを削除しました。');
  };

  const openBuilder = (test?: TestPaper) => {
    setActiveTest(test);
    navigate('test-builder');
  };

  const openPreview = (test: TestPaper) => {
    setActiveTest(test);
    navigate('print-preview');
  };

  return (
    <main>
      <header className="app-header">
        <button type="button" className="brand-button" onClick={() => navigate('home')}>
          <span className="brand-mark">Beta</span>
          <span>テスト作成ツール</span>
        </button>
        <div className="header-meta">
          {screen === 'home' ? <span className="local-chip">ローカル DEMO</span> : <button type="button" className="secondary" onClick={() => navigate('home')}>← ホームに戻る</button>}
        </div>
      </header>

      {screen === 'home' ? (
        <section className="home-screen">
          <p className="eyebrow">TEST CREATOR DEMO</p>
          <h1>何をしますか？</h1>
          <p className="home-lead">作業を選ぶと、その画面へ移動します。ログインは不要です。</p>
          <div className="home-cards">
            <button type="button" className="home-card primary-card" onClick={() => navigate('subject-select')}>
              <span className="card-icon">＋</span><strong>テスト作成</strong><small>科目を選び、小テストを作成します</small>
            </button>
            <button type="button" className="home-card" onClick={startProblem}>
              <span className="card-icon">✎</span><strong>オリジナル問題作成</strong><small>問題文・正答・解説を登録します</small>
            </button>
            <button type="button" className="home-card" onClick={() => navigate('problem-list')}>
              <span className="card-icon">▤</span><strong>保存済み問題を閲覧</strong><small>登録済みの問題を確認・再編集します</small>
            </button>
            <button type="button" className="home-card" onClick={() => navigate('test-list')}>
              <span className="card-icon">▣</span><strong>作成済みテストを閲覧</strong><small>保存済みのテストを再編集します</small>
            </button>
          </div>
        </section>
      ) : null}

      {screen === 'subject-select' ? (
        <section className="workflow-screen">
          <div className="section-header">
            <div><p className="eyebrow">STEP 1</p><h2>テストの種類と科目を選択</h2></div>
            <button type="button" className="secondary" onClick={() => navigate('home')}>キャンセル</button>
          </div>
          <div className="choice-group">
            <p>テストの種類</p>
            <div className="choice-row"><button type="button" className="choice active">小テスト</button><button type="button" className="choice disabled" disabled>定期テスト（DEMO対象外）</button></div>
          </div>
          <div className="choice-group">
            <p>科目</p>
            <div className="choice-row">
              {(['数学I', '数学A'] as const).map((item) => <button type="button" className={'choice ' + (subject === item ? 'active' : '')} key={item} onClick={() => setSubject(item)}>{item}</button>)}
              <button type="button" className="choice disabled" disabled>他教科（今後対応予定）</button>
            </div>
          </div>
          <div className="actions"><button type="button" className="secondary" onClick={() => navigate('home')}>戻る</button><button type="button" onClick={() => openBuilder()}>この内容で作成する</button></div>
        </section>
      ) : null}

      {screen === 'problem-editor' ? (
        <section>
          <div className="section-header"><div><p className="eyebrow">ORIGINAL PROBLEM</p><h2>{editing.id ? 'オリジナル問題を編集' : 'オリジナル問題を作成'}</h2></div><button type="button" className="secondary" onClick={() => navigate('home')}>キャンセル</button></div>
          <form onSubmit={saveProblem}>
            <div className="form-grid">
              <label>問題タイトル<input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
              <label>科目<select value={editing.subject} onChange={(event) => setEditing({ ...editing, subject: event.target.value as Subject })}><option>数学I</option><option>数学A</option></select></label>
              <label>単元<input value={editing.unit} onChange={(event) => setEditing({ ...editing, unit: event.target.value })} placeholder="例：数と式" /></label>
              <label>問題形式<select value={editing.format ?? '記述'} onChange={(event) => setEditing({ ...editing, format: event.target.value as Problem['format'] })}><option>記述</option><option>選択</option><option>数値</option></select></label>
            </div>
            <label>配点<input type="number" min="1" value={editing.defaultPoints} onChange={(event) => setEditing({ ...editing, defaultPoints: Number(event.target.value) })} /></label>
            <label>問題文<textarea value={editing.questionText} onChange={(event) => setEditing({ ...editing, questionText: event.target.value })} /></label>
            <label>正答<textarea value={editing.answerText} onChange={(event) => setEditing({ ...editing, answerText: event.target.value })} /></label>
            <label>解説（任意）<textarea value={editing.explanation} onChange={(event) => setEditing({ ...editing, explanation: event.target.value })} /></label>
            <div className="actions"><button type="button" className="secondary" onClick={() => navigate('home')}>キャンセル</button><button type="submit">保存する</button></div>
          </form>
          {message ? <p role="alert">{message}</p> : null}
        </section>
      ) : null}

      {screen === 'problem-list' ? (
        <section>
          <div className="section-header"><div><p className="eyebrow">PROBLEM BANK</p><h2>保存済みオリジナル問題</h2></div><div className="actions compact"><button type="button" className="secondary" onClick={() => navigate('home')}>ホームに戻る</button><button type="button" onClick={startProblem}>新しい問題を作成</button></div></div>
          <div className="filters">{(['すべて', '数学I', '数学A'] as const).map((item) => <button type="button" className={filter === item ? 'active-filter' : 'secondary'} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
          {message ? <p role="alert">{message}</p> : null}
          {visibleProblems.length === 0 ? <p>登録済みの問題はありません。</p> : <div className="problem-list">{visibleProblems.map((problem) => <article key={problem.id}><div><strong>{problem.title}</strong><p>{problem.subject}・{problem.unit}・{problem.format ?? '記述'}／{problem.defaultPoints}点</p><p className="question">{problem.questionText}</p></div><div className="actions"><button type="button" className="secondary" onClick={() => { setEditing(problem); navigate('problem-editor'); }}>編集</button><button type="button" className="danger" onClick={() => void deleteProblem(problem)}>削除</button></div></article>)}</div>}
        </section>
      ) : null}

      {screen === 'test-builder' ? (
        <TestBuilder
          problems={activeTest ? problems : problems.filter((problem) => problem.subject === subject)}
          initialTest={activeTest}
          onOpenTest={(test) => { setActiveTest(test); void loadTests(); navigate('print-preview'); }}
        />
      ) : null}

      {screen === 'test-list' ? (
        <section>
          <div className="section-header"><div><p className="eyebrow">SAVED TESTS</p><h2>作成済みテスト</h2></div><div className="actions compact"><button type="button" className="secondary" onClick={() => navigate('home')}>ホームに戻る</button><button type="button" onClick={() => navigate('subject-select')}>新規テスト作成</button></div></div>
          {message ? <p role="alert">{message}</p> : null}
          {tests.length === 0 ? <p>作成済みのテストはありません。</p> : <div className="saved-tests">{tests.map((test) => <article className="saved-test" key={test.id}><div><strong>{test.name}</strong><p>作成日時：{formatDate(test.createdAt)} ／ 小テスト ／ {test.items.length}問</p></div><div className="actions"><button type="button" className="secondary" onClick={() => openBuilder(test)}>再編集</button><button type="button" className="secondary" onClick={() => openPreview(test)}>プレビュー</button><button type="button" className="danger" onClick={() => void deleteTest(test)}>削除</button></div></article>)}</div>}
        </section>
      ) : null}

      {screen === 'print-preview' ? <PrintPreview test={activeTest} problems={problems} /> : null}
    </main>
  );
}
