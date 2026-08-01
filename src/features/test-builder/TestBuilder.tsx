import { useEffect, useMemo, useState } from 'react';
import type { Problem, TestItem, TestPaper } from '../../storage/models';

type Props = {
  problems: Problem[];
  initialTest?: TestPaper;
  onOpenTest: (test: TestPaper) => void;
};

const emptyTest = (): TestPaper => ({ id: '', name: '', items: [], createdAt: '', updatedAt: '' });

export function TestBuilder({ problems, initialTest, onOpenTest }: Props) {
  const [draft, setDraft] = useState<TestPaper>(emptyTest);
  const [saved, setSaved] = useState<TestPaper[]>([]);
  const [message, setMessage] = useState('');

  const load = async () => setSaved(await window.desktop.tests.list());
  useEffect(() => { void load(); }, []);

  useEffect(() => { setDraft(initialTest ?? emptyTest()); }, [initialTest?.id]);
  const normalized = (items: TestItem[]) => items.map((item, index) => ({ ...item, order: index + 1 }));
  const total = useMemo(() => draft.items.reduce((sum, item) => sum + item.points, 0), [draft.items]);

  const toggle = (problem: Problem) => {
    const selected = draft.items.some((item) => item.problemId === problem.id);
    const items = selected
      ? draft.items.filter((item) => item.problemId !== problem.id)
      : [...draft.items, { problemId: problem.id, points: problem.defaultPoints, order: draft.items.length + 1 }];
    setDraft({ ...draft, items: normalized(items) });
  };

  const updatePoints = (problemId: string, points: number) => {
    setDraft({ ...draft, items: draft.items.map((item) => item.problemId === problemId ? { ...item, points: Math.max(1, points || 1) } : item) });
  };

  const move = (index: number, direction: number) => {
    const target = index + direction;
    if (target < 0 || target >= draft.items.length) return;
    const items = [...draft.items];
    [items[index], items[target]] = [items[target], items[index]];
    setDraft({ ...draft, items: normalized(items) });
  };

  const save = async () => {
    if (!draft.name.trim() || draft.items.length === 0) {
      setMessage('テスト名と少なくとも1問の問題を設定してください。');
      return;
    }
    const savedTest = await window.desktop.tests.save({ ...draft, name: draft.name.trim() });
    setDraft(savedTest);
    setMessage('テストを保存しました。');
    onOpenTest(savedTest);
    await load();
  };

  const open = (test: TestPaper) => {
    setDraft(test);
    setMessage('保存済みテストを開きました。');
    onOpenTest(test);
  };

  const remove = async (test: TestPaper) => {
    if (!window.confirm('「' + test.name + '」を削除しますか？')) return;
    await window.desktop.tests.delete(test.id);
    if (draft.id === test.id) setDraft(emptyTest());
    await load();
  };

  return <section>
    <h2>テスト作成</h2>
    <label>テスト名<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="例：数と式 小テスト" /></label>
    <p>選択中：{draft.items.length}問 ／ 合計：{total}点</p>
    <div className="test-layout">
      <div><h3>登録問題から選択</h3>{problems.map((problem) => <label className="pick-row" key={problem.id}><input type="checkbox" checked={draft.items.some((item) => item.problemId === problem.id)} onChange={() => toggle(problem)} /> {problem.subject}・{problem.unit}：{problem.title}（標準 {problem.defaultPoints}点）</label>)}</div>
      <div><h3>テストに入れる問題</h3>{draft.items.map((item, index) => <div className="test-item" key={item.problemId}><strong>{index + 1}. {problems.find((problem) => problem.id === item.problemId)?.title ?? '削除済みの問題'}</strong><label>配点<input type="number" min="1" value={item.points} onChange={(event) => updatePoints(item.problemId, Number(event.target.value))} /></label><button type="button" className="secondary" onClick={() => move(index, -1)} disabled={index === 0}>上へ</button><button type="button" className="secondary" onClick={() => move(index, 1)} disabled={index === draft.items.length - 1}>下へ</button></div>)}</div>
    </div>
    <div className="actions"><button type="button" className="secondary" onClick={() => setDraft(emptyTest())}>新しいテスト</button><button type="button" onClick={() => void save()}>テストを保存</button></div>
    {message ? <p role="alert">{message}</p> : null}
    <h3>保存済みテスト</h3>
    {saved.length === 0 ? <p>保存済みのテストはありません。</p> : saved.map((test) => <div className="saved-test" key={test.id}><span>{test.name}（{test.items.length}問）</span><div><button type="button" className="secondary" onClick={() => open(test)}>再編集</button><button type="button" className="danger" onClick={() => void remove(test)}>削除</button></div></div>)}
  </section>;
}
