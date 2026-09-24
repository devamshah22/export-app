import React, { useState } from 'react';
import { TextField, Autocomplete } from '@mui/material';

/**
 * Searchable dropdown component
 * @param {string} label - Field label
 * @param {array} options - Array of {id, name, ...} objects
 * @param {any} value - Selected value (id)
 * @param {function} onChange - Called with selected option object
 * @param {string} displayKey - Key to display in dropdown (default: 'name')
 * @param {boolean} fullWidth
 */
export default function SearchableDropdown({ label, options, value, onChange, displayKey = 'name', fullWidth = true, size = 'normal' }) {
    const selectedOption = options.find(o => o.id === parseInt(value)) || null;

    return (
        <Autocomplete
            options={options}
            value={selectedOption}
            onChange={(e, newValue) => onChange(newValue)}
            getOptionLabel={(option) => option[displayKey] || ''}
            isOptionEqualToValue={(option, val) => option.id === val?.id}
            size={size}
            fullWidth={fullWidth}
            renderInput={(params) => (
                <TextField {...params} label={label} fullWidth />
            )}
        />
    );
}
