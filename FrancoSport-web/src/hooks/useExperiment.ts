import { useState, useEffect } from 'react';
import { getVariant, trackExperimentExposure } from '@/api/ab-testing.service';

export const useExperiment = (experimentId: string, variants: string[]) => {
    const [variant, setVariant] = useState<string>(variants[0]);

    useEffect(() => {
        const assignedVariant = getVariant(experimentId, variants);
        setVariant(assignedVariant);
        trackExperimentExposure(experimentId, assignedVariant);
    }, [experimentId]); // Run only once per experimentId

    return variant;
};
