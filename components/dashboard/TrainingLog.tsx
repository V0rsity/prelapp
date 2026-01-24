// components/dashboard/TrainingLog.tsx
import { useState, useContext, useRef, useEffect } from "react";
import { Minus, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AuthContext } from "../../context/AuthContext";
import { TRAINING_METRIC_CONFIG, getVisibleTrainingFields, shouldShowField } from "@/config/metrics";

interface TrainingLogProps {
  currentDate: string;
  userProfile: any;
  existingLog?: any;
  onComplete: () => void;
}

export default function TrainingLog({ currentDate, userProfile, existingLog, onComplete }: TrainingLogProps) {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic form state based on config
  const [formState, setFormState] = useState<Record<string, any>>(() => {
    const initialState: Record<string, any> = {};
    Object.entries(TRAINING_METRIC_CONFIG).forEach(([key, config]) => {
      const dbField = `training_${key}`;
      const existingValue = existingLog?.[dbField];
      initialState[key] = existingValue !== undefined && existingValue !== null 
        ? existingValue 
        : config.defaultValue;
    });
    return initialState;
  });

  // Track open dropdowns dynamically
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Get visible fields based on user profile
  const visibleFields = getVisibleTrainingFields(userProfile?.event_types || []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(dropdownRefs.current).forEach(([key, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdowns(prev => ({ ...prev, [key]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (fieldKey: string) => {
    setOpenDropdowns(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const addMultiselectValue = (fieldKey: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [fieldKey]: [...prev[fieldKey], value]
    }));
    setOpenDropdowns(prev => ({ ...prev, [fieldKey]: false }));
  };

  const removeMultiselectValue = (fieldKey: string, value: string) => {
    setFormState(prev => {
      const newState = { ...prev, [fieldKey]: prev[fieldKey].filter((v: string) => v !== value) };
      
      // Clear dependent fields when their dependency is removed
      Object.entries(TRAINING_METRIC_CONFIG).forEach(([depKey, depConfig]) => {
        if ('dependsOn' in depConfig && depConfig.dependsOn) {
          const dependsOn = depConfig.dependsOn as { field: string; values: readonly string[] };
          if (dependsOn.field === fieldKey && (dependsOn.values as readonly string[]).includes(value)) {
            // Check if any other selected values still satisfy the dependency
            const stillValid = newState[fieldKey].some((v: string) => 
              (dependsOn.values as readonly string[]).includes(v)
            );
            if (!stillValid) {
              newState[depKey] = depConfig.defaultValue;
            }
          }
        }
      });
      
      return newState;
    });
  };

  const updateFieldValue = (fieldKey: string, value: any) => {
    setFormState(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset form state to defaults
    const initialState: Record<string, any> = {};
    Object.entries(TRAINING_METRIC_CONFIG).forEach(([key, config]) => {
      const dbField = `training_${key}`;
      const existingValue = existingLog?.[dbField];
      initialState[key] = existingValue !== undefined && existingValue !== null 
        ? existingValue 
        : config.defaultValue;
    });
    setFormState(initialState);
    // Clear open dropdowns
    setOpenDropdowns({});
  };

  const handleSubmit = async () => {
    if (!user || !currentDate || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Build log data from form state
      const logData: any = {
        user_id: user.id,
        date: currentDate,
        training_complete: true,
      };

      Object.entries(TRAINING_METRIC_CONFIG).forEach(([key, config]) => {
        const value = formState[key];
        const dbField = `training_${key}`;

        // Only include field if it should be shown based on dependencies
        if (!shouldShowField(key, formState)) {
          logData[dbField] = null;
          return;
        }

        // Handle different input types
        if (config.inputType === 'multiselect') {
          logData[dbField] = value && value.length > 0 ? value : null;
        } else if (config.inputType === 'mileage') {
          logData[dbField] = value ? parseFloat(value) : null;
        } else if (config.inputType === 'textarea') {
          logData[dbField] = value || null;
        } else {
          logData[dbField] = value;
        }
      });

      let result;

      if (existingLog) {
        // UPDATE existing log
        const { data, error } = await supabase
          .from("daily_logs")
          .update(logData)
          .eq("id", existingLog.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // INSERT new log
        const { data, error } = await supabase
          .from("daily_logs")
          .insert(logData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Update sessionStorage
      const cachedLogs = sessionStorage.getItem('dailyLogs');
      const dailyLogs = cachedLogs ? JSON.parse(cachedLogs) : [];
      
      const index = dailyLogs.findIndex((log: any) => log.id === result.id);
      if (index !== -1) {
        dailyLogs[index] = result;
      } else {
        dailyLogs.unshift(result);
      }
      
      sessionStorage.setItem('dailyLogs', JSON.stringify(dailyLogs));

      setIsOpen(false);
      onComplete();
    } catch (err) {
      console.error("Error submitting training data:", err);
      alert("Failed to submit training data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (fieldKey: string, config: any) => {
    // Check if field should be shown based on dependencies
    if (!shouldShowField(fieldKey, formState)) {
      return null;
    }

    const value = formState[fieldKey];

    switch (config.inputType) {
      case 'dropdown':
        return (
          <div className="training-section" key={fieldKey}>
            <label className="training-label">{config.label}</label>
            <div className="metric-selector-wrapper">
              <select
                value={value}
                onChange={(e) => updateFieldValue(fieldKey, parseInt(e.target.value))}
                className="metric-select"
              >
                {Object.entries(config.options).map(([optValue, optConfig]: [string, any]) => (
                  <option key={optValue} value={optValue}>{optConfig.label}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'multiselect':
        // Get available options (filter by event types if applicable)
        const allOptions = Object.entries(config.options).filter(([_, optConfig]: [string, any]) => {
          if (!userProfile?.event_types || userProfile.event_types.length === 0) return false;
          if ('eventTypes' in optConfig) {
            return optConfig.eventTypes.some((eventType: string) => 
              userProfile.event_types.includes(eventType)
            );
          }
          return true;
        });

        const selectedValues = value || [];
        const availableOptions = allOptions.filter(([optKey]) => !selectedValues.includes(optKey));

        // Determine pill styling
        const getPillStyle = (optKey: string) => {
          if (config.pillStyle) {
            return {
              backgroundColor: config.pillStyle.fillColor,
              color: config.pillStyle.textColor,
              border: `2px solid ${config.pillStyle.borderColor}`,
            };
          }
          const optConfig = config.options[optKey];
          return {
            backgroundColor: optConfig.fillColor,
            color: optConfig.textColor,
            border: `2px solid ${optConfig.fillColor}`,
          };
        };

        return (
          <div className="training-section" key={fieldKey}>
            <label className="training-label">{config.label}</label>
            <div className="training-types-container">
              {selectedValues.map((optKey: string) => {
                const optConfig = config.options[optKey];
                return (
                  <button
                    key={optKey}
                    onClick={() => removeMultiselectValue(fieldKey, optKey)}
                    className="training-type-pill active"
                    style={getPillStyle(optKey)}
                  >
                    {optConfig.label}
                    <X size={16} className="pill-x" />
                  </button>
                );
              })}
              {availableOptions.length > 0 && (
                <div 
                  className="add-pill-wrapper" 
                  ref={(el) => { dropdownRefs.current[fieldKey] = el; }}
                >
                  <button 
                    className="add-pill-button"
                    onClick={() => toggleDropdown(fieldKey)}
                  >
                    <Plus size={20} />
                  </button>
                  {openDropdowns[fieldKey] && (
                    <div className="pill-dropdown">
                      {availableOptions.map(([optKey, optConfig]: [string, any]) => (
                        <div
                          key={optKey}
                          className="pill-dropdown-item"
                          onClick={() => addMultiselectValue(fieldKey, optKey)}
                        >
                          {optConfig.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="training-section" key={fieldKey}>
            <label className="training-label">{config.label}</label>
            <input
              type="number"
              step={config.numberConfig?.step}
              min={config.numberConfig?.min}
              max={config.numberConfig?.max}
              value={value}
              onChange={(e) => updateFieldValue(fieldKey, e.target.value)}
              placeholder={config.numberConfig?.placeholder}
              className="mileage-input"
            />
          </div>
        );

      case 'mileage':
        const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let inputValue = e.target.value;
          
          // Allow empty string
          if (inputValue === '') {
            updateFieldValue(fieldKey, '');
            return;
          }
          
          // Remove any non-numeric characters except decimal point
          inputValue = inputValue.replace(/[^\d.]/g, '');
          
          // Ensure only one decimal point
          const parts = inputValue.split('.');
          if (parts.length > 2) {
            inputValue = parts[0] + '.' + parts.slice(1).join('');
          }
          
          // Limit decimal places
          if (parts.length === 2 && parts[1].length > config.mileageConfig.decimalPlaces) {
            inputValue = parts[0] + '.' + parts[1].slice(0, config.mileageConfig.decimalPlaces);
          }
          
          // Parse and validate
          const numValue = parseFloat(inputValue);
          
          // Check max value (but allow incomplete typing like "9" or "99.")
          if (!isNaN(numValue) && numValue > config.mileageConfig.maxValue) {
            return; // Don't update if exceeds max
          }
          
          // Update with validated input
          updateFieldValue(fieldKey, inputValue);
        };

        return (
          <div className="training-section" key={fieldKey}>
            <label className="training-label">{config.label}</label>
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={handleMileageChange}
              placeholder={config.mileageConfig?.placeholder}
              className="mileage-input"
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="notes-container" key={fieldKey}>
            <label className="notes-label">
              <span>{config.label}</span>
            </label>
            <textarea
              value={value}
              onChange={(e) => updateFieldValue(fieldKey, e.target.value)}
              className="notes-textarea"
              rows={config.textareaConfig?.rows || 6}
              placeholder={config.textareaConfig?.placeholder}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) {
    return (
      <div className="main-container closed training-log" onClick={() => setIsOpen(true)}>
        <div className="training-log-header">
          <span className="training-log-title">Training Log</span>
          <Plus size={24} className="training-log-icon" />
        </div>
      </div>
    );
  }

  return (
    <div className="main-container training-log">
      <div className="training-log-header">
        <span className="training-log-title">Training Log</span>
        <Minus size={24} className="training-log-icon" onClick={handleClose} />
      </div>
      <h3 className="subheading">How was your practice?</h3>

      {visibleFields.map(({ key, config }) => renderField(key, config))}

      <button 
        className="submit-button" 
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}