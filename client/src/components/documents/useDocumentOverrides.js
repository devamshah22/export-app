import { useEffect, useMemo, useState } from 'react';

export default function useDocumentOverrides(data, documentType, conflictDraft) {
    const canonicalOverrides = useMemo(
        () => data?.overrides?.[documentType] || {},
        [data?.overrides, documentType]
    );
    const attemptedOverrides = useMemo(() => (
        conflictDraft?.type === 'document' && conflictDraft.document === documentType
            ? conflictDraft.saveParts?.overrides || {}
            : null
    ), [conflictDraft, documentType]);
    const sourceOverrides = attemptedOverrides || canonicalOverrides;
    const [overrides, setOverrides] = useState(() => ({ ...sourceOverrides }));

    useEffect(() => {
        setOverrides({ ...sourceOverrides });
    }, [sourceOverrides]);

    return [overrides, setOverrides];
}
