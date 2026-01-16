import React from 'react';

/**
 * Composant de champ de formulaire accessible
 * Gère automatiquement les labels, erreurs, hints, et états ARIA
 * 
 * @param {Object} props
 * @param {string} props.id - ID unique du champ
 * @param {string} props.label - Label du champ
 * @param {string} props.type - Type d'input: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'textarea' | 'select'
 * @param {string} props.value - Valeur du champ
 * @param {Function} props.onChange - Callback de changement
 * @param {string} props.error - Message d'erreur
 * @param {string} props.hint - Texte d'aide
 * @param {boolean} props.required - Champ obligatoire
 * @param {boolean} props.disabled - Champ désactivé
 * @param {string} props.placeholder - Placeholder
 * @param {Array} props.options - Options pour select (array de {value, label})
 * @param {number} props.rows - Nombre de lignes pour textarea
 * @param {string} props.className - Classes CSS additionnelles
 * 
 * @example
 * <FormField
 *   id="username"
 *   label="Nom d'utilisateur"
 *   type="text"
 *   value={username}
 *   onChange={(e) => setUsername(e.target.value)}
 *   error={usernameError}
 *   hint="3-20 caractères"
 *   required
 * />
 */
const FormField = ({
    id,
    label,
    type = 'text',
    value,
    onChange,
    error,
    hint,
    required = false,
    disabled = false,
    placeholder,
    options = [],
    rows = 4,
    className = '',
    ...rest
}) => {
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const hasError = !!error;

    const baseInputClasses = `
        w-full px-4 py-2 
        bg-gray-800 border rounded-lg
        text-white placeholder-gray-500
        focus:outline-none focus:ring-2 focus:ring-violet-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
        ${hasError ? 'border-red-500' : 'border-gray-700'}
        ${className}
    `;

    const renderInput = () => {
        if (type === 'textarea') {
            return (
                <textarea
                    id={id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    rows={rows}
                    className={baseInputClasses}
                    aria-invalid={hasError}
                    aria-describedby={`${hint ? hintId : ''} ${error ? errorId : ''}`.trim()}
                    {...rest}
                />
            );
        }

        if (type === 'select') {
            return (
                <select
                    id={id}
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    className={baseInputClasses}
                    aria-invalid={hasError}
                    aria-describedby={`${hint ? hintId : ''} ${error ? errorId : ''}`.trim()}
                    {...rest}
                >
                    <option value="">{placeholder || 'Sélectionner...'}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        }

        return (
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={baseInputClasses}
                aria-invalid={hasError}
                aria-describedby={`${hint ? hintId : ''} ${error ? errorId : ''}`.trim()}
                {...rest}
            />
        );
    };

    return (
        <div className="mb-4">
            {/* Label */}
            <label
                htmlFor={id}
                className="block mb-2 text-sm font-medium text-gray-200"
            >
                {label}
                {required && <span className="ml-1 text-red-500" aria-label="obligatoire">*</span>}
            </label>

            {/* Input */}
            {renderInput()}

            {/* Hint */}
            {hint && !error && (
                <p id={hintId} className="mt-1 text-sm text-gray-400">
                    {hint}
                </p>
            )}

            {/* Error */}
            {error && (
                <p id={errorId} className="mt-1 text-sm text-red-500" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormField;
