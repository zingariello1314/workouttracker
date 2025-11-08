import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Zap } from 'lucide-react';
import StarRating from '../../../ui/StarRating';
import { getFormConfig } from '../../../../services/endurance/enduranceFormSchema';

const buildInputProps = (activityType, field, value, onChange) => ({
  id: `${activityType}-${field.key}`,
  value: value ?? '',
  onChange,
  className:
    'w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors',
  placeholder: field.placeholder || ''
});

const EnduranceSessionForm = ({ activityType, formState, setFormState }) => {
  const config = useMemo(() => getFormConfig(activityType), [activityType]);

  const handleInputChange = useCallback(
    (key) => (eventOrValue) => {
      const nextValue = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
      setFormState((prev) => ({ ...prev, [key]: nextValue }));
    },
    [setFormState]
  );

  if (!config) {
    return null;
  }

  const columnsClass = config.columns === 1 ? 'md:grid-cols-1' : config.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';
  const ratingsColumnsClass = config.ratingsColumns === 1 ? 'md:grid-cols-1' : config.ratingsColumns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';

  const renderFieldInput = (field) => {
    const inputProps = buildInputProps(activityType, field, formState[field.key], handleInputChange(field.key));

    switch (field.type) {
      case 'textarea':
        return <textarea {...inputProps} rows={field.rows || 3} />;
      case 'number':
        return <input {...inputProps} type="number" step={field.step || 'any'} />;
      case 'select':
        return (
          <select {...inputProps}>
            {field.placeholder && (
              <option value="" disabled={field.disablePlaceholderOption}>
                {field.placeholder}
              </option>
            )}
            {(field.options || []).map((option) => (
              <option key={`${activityType}-${field.key}-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'time':
        return <input {...inputProps} type="time" />;
      case 'date':
        return <input {...inputProps} type="date" />;
      default:
        return <input {...inputProps} type={field.type || 'text'} />;
    }
  };

  return (
    <>
      {config.fields?.length > 0 && (
        <div className={`grid grid-cols-1 ${columnsClass} gap-6`}>
          {config.fields.map((field) => (
            <div
              key={`${activityType}-${field.key}`}
              className={field.colSpan && field.colSpan > 1 ? 'md:col-span-2' : ''}
            >
              <label
                htmlFor={`${activityType}-${field.key}`}
                className="block text-slate-300 text-sm font-medium mb-2"
              >
                {field.label}
              </label>
              {renderFieldInput(field)}
            </div>
          ))}
        </div>
      )}

      {config.ratings?.length > 0 && (
        <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
          <h4 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            {config.ratingTitle || 'Évaluation'}
          </h4>
          <div className={`grid grid-cols-1 ${ratingsColumnsClass} gap-6`}>
            {config.ratings.map((rating) => (
              <StarRating
                key={`${activityType}-rating-${rating.key}`}
                label={rating.label}
                rating={formState[rating.key] ?? 0}
                onRatingChange={(value) => setFormState((prev) => ({ ...prev, [rating.key]: value }))}
                size="md"
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

EnduranceSessionForm.propTypes = {
  activityType: PropTypes.string.isRequired,
  formState: PropTypes.object.isRequired,
  setFormState: PropTypes.func.isRequired
};

export default EnduranceSessionForm;
