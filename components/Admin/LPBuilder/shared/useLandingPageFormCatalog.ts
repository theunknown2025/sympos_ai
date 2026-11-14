import { useEffect, useMemo, useState } from 'react';
import type { EvaluationForm, RegistrationForm } from '../../../../types';
import { getUserRegistrationForms, inferRegistrationFormCategory } from '../../../../services/registrationFormService';
import { getUserEvaluationForms } from '../../../../services/evaluationFormService';
import type { LandingPageFormCategory, LandingPageFormOption } from './landingPageActionButton';

export function useLandingPageFormCatalog(userId: string | undefined) {
  const [registrationForms, setRegistrationForms] = useState<RegistrationForm[]>([]);
  const [evaluationForms, setEvaluationForms] = useState<EvaluationForm[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setRegistrationForms([]);
      setEvaluationForms([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [reg, evalForms] = await Promise.all([
          getUserRegistrationForms(userId),
          getUserEvaluationForms(userId),
        ]);
        if (!cancelled) {
          setRegistrationForms(reg);
          setEvaluationForms(evalForms);
        }
      } catch (e) {
        console.error('Error loading landing page form catalog:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const options: LandingPageFormOption[] = useMemo(() => {
    const reg: LandingPageFormOption[] = registrationForms.map((f) => ({
      id: f.id,
      title: f.title,
      category: inferRegistrationFormCategory(f) as LandingPageFormCategory,
    }));
    const ev: LandingPageFormOption[] = evaluationForms.map((f) => ({
      id: f.id,
      title: f.title,
      category: 'evaluation' as const,
    }));
    return [...reg, ...ev];
  }, [registrationForms, evaluationForms]);

  return { options, loading, registrationForms, evaluationForms };
}
