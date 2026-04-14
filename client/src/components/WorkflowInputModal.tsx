import { useState, useEffect, useRef } from "react";
import type { StepInputSchema, InputField } from "@skillrunner/shared";

interface Props {
  schemas: StepInputSchema[];
  onSubmit: (inputs: Record<string, Record<string, string>>) => void;
  onCancel: () => void;
  loading: boolean;
}

type FormValues = Record<string, Record<string, string>>;

function initialValues(schemas: StepInputSchema[]): FormValues {
  const out: FormValues = {};
  for (const schema of schemas) {
    out[schema.stepId] = {};
    for (const field of schema.fields) {
      out[schema.stepId][field.label] = "";
    }
  }
  return out;
}

function isComplete(values: FormValues, schemas: StepInputSchema[]): boolean {
  for (const schema of schemas) {
    for (const field of schema.fields) {
      if (field.required && !values[schema.stepId]?.[field.label]?.trim()) {
        return false;
      }
    }
  }
  return true;
}

export function WorkflowInputModal({ schemas, onSubmit, onCancel, loading }: Props) {
  const [values, setValues] = useState<FormValues>(() => initialValues(schemas));
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Focus first input on mount
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  function setValue(stepId: string, label: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], [label]: value },
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete(values, schemas)) return;
    // Strip empty optional fields before sending
    const stripped: FormValues = {};
    for (const [stepId, fields] of Object.entries(values)) {
      stripped[stepId] = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v.trim() !== "")
      );
    }
    onSubmit(stripped);
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onCancel();
  }

  const ready = isComplete(values, schemas);
  let refSet = false;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        className="modal modal-inputs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="input-modal-title"
      >
        <div className="modal-inputs-header">
          <h3 id="input-modal-title">Configure your workflow</h3>
          <p className="modal-inputs-subtitle">
            {schemas.length === 1
              ? "This step needs a few details before it can run."
              : `${schemas.length} steps need a few details before running.`}
          </p>
        </div>

        <form
          className="modal-inputs-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {schemas.map((schema, si) => (
            <fieldset key={schema.stepId} className="input-step-section">
              {schemas.length > 1 && (
                <legend className="input-step-legend">
                  <span className="input-step-number">{si + 1}</span>
                  {schema.stepName}
                </legend>
              )}

              <div className="input-fields-list">
                {schema.fields.map((field) => {
                  const isFirst = !refSet;
                  if (isFirst) refSet = true;

                  return (
                    <InputFieldRow
                      key={field.id}
                      field={field}
                      value={values[schema.stepId]?.[field.label] ?? ""}
                      onChange={(v) => setValue(schema.stepId, field.label, v)}
                      inputRef={isFirst ? firstInputRef : undefined}
                      disabled={loading}
                    />
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!ready || loading}
            >
              {loading ? "Starting…" : "Run pipeline →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Single field row ─────────────────────────────────────────────────────────

interface FieldRowProps {
  field: InputField;
  value: string;
  onChange: (v: string) => void;
  inputRef?: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  disabled: boolean;
}

function InputFieldRow({ field, value, onChange, inputRef, disabled }: FieldRowProps) {
  const id = `field-${field.id}`;
  const missingRequired = field.required && value.trim() === "";

  return (
    <div className="input-field-row">
      <label className="input-field-label" htmlFor={id}>
        {field.label}
        {field.required
          ? <span className="input-field-badge input-field-badge-required">required</span>
          : <span className="input-field-badge input-field-badge-optional">optional</span>
        }
      </label>

      {field.type === "textarea" ? (
        <textarea
          id={id}
          className={`input-field-control${missingRequired ? " input-field-error" : ""}`}
          placeholder={field.placeholder ?? ""}
          value={value}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        />
      ) : (
        <input
          id={id}
          type={field.type === "url" ? "url" : field.type === "number" ? "number" : "text"}
          className={`input-field-control${missingRequired ? " input-field-error" : ""}`}
          placeholder={field.placeholder ?? ""}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          ref={inputRef as React.RefObject<HTMLInputElement>}
        />
      )}
    </div>
  );
}
