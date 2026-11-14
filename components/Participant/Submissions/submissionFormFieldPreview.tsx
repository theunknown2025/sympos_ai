import React from 'react';
import type { FormField, FormSubmission, RegistrationForm } from '../../../types';

export function renderSubmissionFieldValue(
  field: FormField,
  submission: FormSubmission
): React.ReactNode {
  const value = submission.answers[field.id];

  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400 italic">Not provided</span>;
  }

  switch (field.type) {
    case 'checkbox':
      if (field.multiple && Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : <span className="text-slate-400 italic">Not provided</span>;
      }
      return value ? 'Yes' : 'No';

    case 'file':
      return (
        <a
          href={value as string}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          View file
        </a>
      );

    case 'date':
      if (value instanceof Date) return value.toLocaleDateString();
      if (typeof value === 'string') return new Date(value).toLocaleDateString();
      return String(value);

    case 'textarea':
      return <div className="whitespace-pre-wrap">{String(value)}</div>;

    default:
      if (Array.isArray(value)) return value.join(', ');
      return String(value);
  }
}

interface SubmissionFormAnswersPreviewProps {
  form: RegistrationForm;
  submission: FormSubmission;
}

export const SubmissionFormAnswersPreview: React.FC<SubmissionFormAnswersPreviewProps> = ({
  form,
  submission,
}) => (
  <div className="space-y-4">
    {(form.generalInfo.collectName ||
      form.generalInfo.collectEmail ||
      form.generalInfo.collectPhone ||
      form.generalInfo.collectOrganization ||
      form.generalInfo.collectAddress) && (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-800">General information</h4>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {form.generalInfo.collectName ? (
            <div>
              <dt className="text-slate-500 font-medium">Name</dt>
              <dd className="text-slate-900 mt-0.5">
                {submission.generalInfo?.name || <span className="text-slate-400 italic">Not provided</span>}
              </dd>
            </div>
          ) : null}
          {form.generalInfo.collectEmail ? (
            <div>
              <dt className="text-slate-500 font-medium">Email</dt>
              <dd className="text-slate-900 mt-0.5">
                {submission.generalInfo?.email || <span className="text-slate-400 italic">Not provided</span>}
              </dd>
            </div>
          ) : null}
          {form.generalInfo.collectPhone ? (
            <div>
              <dt className="text-slate-500 font-medium">Phone</dt>
              <dd className="text-slate-900 mt-0.5">
                {submission.generalInfo?.phone || <span className="text-slate-400 italic">Not provided</span>}
              </dd>
            </div>
          ) : null}
          {form.generalInfo.collectOrganization ? (
            <div>
              <dt className="text-slate-500 font-medium">Organization</dt>
              <dd className="text-slate-900 mt-0.5">
                {submission.generalInfo?.organization || (
                  <span className="text-slate-400 italic">Not provided</span>
                )}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    )}

    {form.sections.map((section) => (
      <div key={section.id} className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-800">{section.title}</h4>
        {section.description ? <p className="text-xs text-slate-600">{section.description}</p> : null}
        {section.subsections?.map((subsection) => (
          <div key={subsection.id} className="ml-2 space-y-3 border-l-2 border-slate-200 pl-3">
            <p className="text-sm font-medium text-slate-700">{subsection.title}</p>
            {subsection.fields.map((field) => (
              <div key={field.id}>
                <p className="text-xs font-medium text-slate-500">{field.label}</p>
                <div className="text-sm text-slate-900 mt-0.5">{renderSubmissionFieldValue(field, submission)}</div>
              </div>
            ))}
          </div>
        ))}
        {section.fields.map((field) => (
          <div key={field.id}>
            <p className="text-xs font-medium text-slate-500">{field.label}</p>
            <div className="text-sm text-slate-900 mt-0.5">{renderSubmissionFieldValue(field, submission)}</div>
          </div>
        ))}
      </div>
    ))}

    {form.fields.map((field) => (
      <div key={field.id}>
        <p className="text-xs font-medium text-slate-500">{field.label}</p>
        <div className="text-sm text-slate-900 mt-0.5">{renderSubmissionFieldValue(field, submission)}</div>
      </div>
    ))}

    <p className="text-xs text-slate-500 pt-2 border-t border-slate-200">
      Submitted {new Date(submission.submittedAt).toLocaleString()}
    </p>
  </div>
);
