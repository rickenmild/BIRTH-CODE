import { useCallback, useEffect, useState } from 'react';
import { getBundle } from '../storage/repo';
import type { Bundle } from '../types';
import { getDraft } from './draft';

export type BundleState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; message: string }
  | { status: 'ready'; bundle: Bundle; saved: boolean; isDraft: boolean };

/** 診断IDから結果一式を取得する。未保存の下書き → 保存済みデータの順で探す。 */
export function useBundle(diagnosisId: string | undefined) {
  const [state, setState] = useState<BundleState>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!diagnosisId) return setState({ status: 'missing' });
      const draft = getDraft();
      if (draft && draft.bundle.diagnosis.id === diagnosisId) {
        return setState({ status: 'ready', bundle: draft.bundle, saved: draft.saved, isDraft: true });
      }
      try {
        const bundle = await getBundle(diagnosisId);
        if (!alive) return;
        setState(bundle ? { status: 'ready', bundle, saved: true, isDraft: false } : { status: 'missing' });
      } catch (e) {
        if (alive) setState({ status: 'error', message: (e as Error).message });
      }
    })();
    return () => {
      alive = false;
    };
  }, [diagnosisId, tick]);

  return { state, reload };
}
