import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { newId } from '../../lib/random';
import { toProfileInput, type FormValues } from '../../lib/validation';
import { getFormDraft, setFormDraft, setPending } from '../../state/draft';
import { ProfileForm } from '../components/ProfileForm';

export function ProfileInputPage() {
  const nav = useNavigate();
  // 戻る操作で入力内容が消えないよう、入力途中の値も保持する
  const initial = useMemo<FormValues>(() => getFormDraft() ?? { displayName: '', birthDate: '', birthTime: '', birthPlace: '' }, []);

  const submit = (v: FormValues) => {
    setPending({ personId: newId(), isNewPerson: true, input: toProfileInput(v) });
    nav('/loading');
  };

  return (
    <div className="stack">
      <h1>PROFILE INPUT</h1>
      <p className="muted">生年月日を入力すると、診断を始めます。</p>
      <ProfileForm initial={initial} submitLabel="診断する" onSubmit={submit} onChange={setFormDraft} />
      <p className="muted small">他の人のプロフィールを登録する場合は、ご本人の了解を得てください。入力した情報はこの端末の中だけに保存されます。</p>
    </div>
  );
}
