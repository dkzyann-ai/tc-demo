import { afterEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { rm } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { createLocalStore } = require('../../src/desktop/localStore.cjs');
const fixtureDirectory = path.join(process.cwd(), 'tests', 'unit', '.local-store-fixture');
const store = createLocalStore(path.join(fixtureDirectory, 'data.json'));

afterEach(async () => {
  await rm(fixtureDirectory, { recursive: true, force: true });
});

describe('localStore', () => {
  it('問題とテストを保存し、テスト参照中の問題は削除しない', async () => {
    const problem = await store.saveProblem({
      id: '',
      title: '因数分解',
      subject: '数学I',
      unit: '数と式',
      questionText: 'x² - 5x + 6 を因数分解しなさい。',
      answerText: '(x - 2)(x - 3)',
      explanation: '',
      defaultPoints: 5,
      createdAt: '',
      updatedAt: '',
    });

    const test = await store.saveTest({
      id: '',
      name: '数と式 小テスト',
      items: [{ problemId: problem.id, points: 8, order: 1 }],
      createdAt: '',
      updatedAt: '',
    });

    expect((await store.listProblems()).map((item: { id: string }) => item.id)).toEqual([problem.id]);
    expect((await store.listTests()).map((item: { id: string }) => item.id)).toEqual([test.id]);
    expect((await store.listProblems('因数')).map((item: { id: string }) => item.id)).toEqual([problem.id]);
    expect((await store.listTests('小テスト')).map((item: { id: string }) => item.id)).toEqual([test.id]);
    await expect(store.deleteProblem(problem.id)).rejects.toThrow('削除できません');

    await store.deleteTest(test.id);
    await store.deleteProblem(problem.id);
    expect(await store.listProblems()).toEqual([]);
    store.seedDemoData();
    store.seedDemoData();
    expect((await store.listProblems()).map((item: { id: string }) => item.id)).toHaveLength(5);
    expect((await store.listProblems('2次関数')).map((item: { id: string }) => item.id)).toEqual(['demo-quadratic']);
    expect((await store.listTests()).map((item: { id: string }) => item.id)).toEqual(['demo-test-quadratic', 'demo-test-counting']);
  });
});
