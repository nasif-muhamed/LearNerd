import React from "react";

const InputField = ({
    id,
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    error,
    required = false,
    className = "",
    disabled = false,
    textarea = false,
    register,
}) => {
    return (
        <div className={`mb-4 ${className}`}>
            <label
                htmlFor={id}
                className="block text-sm font-medium text-foreground mb-1"
            >
                {label}{" "}
                {required && <span className="text-destructive">*</span>}
            </label>

            {textarea ? (
                <textarea
                    id={id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full px-4 py-3 bg-secondary text-foreground rounded-md border ${
                        error ? "border-destructive" : "border-input"
                    } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-y min-h-[120px]`}
                    {...register}
                />
            ) : (
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    {...register}
                    className={`w-full px-4 py-3 bg-secondary text-foreground rounded-md border ${
                        error ? "border-destructive" : "border-input"
                    } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                />
            )}

            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        </div>
    );
};

export default InputField;
