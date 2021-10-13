import { useState, useEffect, useCallback } from 'react';

export default function useWindowFocus(): boolean {
    const [isWindowActive, setWindowActive] = useState(true);

    const handleWindowActivity = useCallback((forcedFlag) => {
        if (typeof forcedFlag === 'boolean') {
            return forcedFlag ? setWindowActive(true) : setWindowActive(false);
        }

        return document.hidden ? setWindowActive(false) : setWindowActive(true);
    },
    []);

    useEffect(() => {
        const handleBlur = () => handleWindowActivity(false);
        const handleFocus = () => handleWindowActivity(true);

        document.addEventListener('visibilitychange', handleWindowActivity);
        document.addEventListener('blur', handleBlur);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('blur', handleWindowActivity);
            document.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleBlur);
            document.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [handleWindowActivity]);

    return isWindowActive;
}
