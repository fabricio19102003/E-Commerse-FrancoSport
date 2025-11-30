import { useUIStore } from '@/store/uiStore';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const useConfirm = () => {
    const { openConfirmation } = useUIStore();

    const confirm = (options: ConfirmOptions): Promise<boolean> => {
        return openConfirmation(options);
    };

    return { confirm };
};
