import { logEvent } from './analytics.service';

const STORAGE_KEY_PREFIX = 'ab_experiment_';

export const getVariant = (experimentId: string, variants: string[]): string => {
    const storageKey = `${STORAGE_KEY_PREFIX}${experimentId}`;
    let variant = localStorage.getItem(storageKey);

    if (!variant || !variants.includes(variant)) {
        // Randomly assign a variant
        const randomIndex = Math.floor(Math.random() * variants.length);
        variant = variants[randomIndex];
        localStorage.setItem(storageKey, variant);
    }

    return variant;
};

export const trackExperimentExposure = (experimentId: string, variant: string) => {
    logEvent('experiment_impression', experimentId, variant);
};
