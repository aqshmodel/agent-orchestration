import { useLanguage } from '../contexts/LanguageContext';
import { SessionMetadata } from '../components/modals/SessionManagerModal';

export const useSession = () => {
    const { t } = useLanguage();

    const saveSessionToStorage = (name: string, data: any) => {
        try {
            const id = Date.now().toString();
            const sessionData = {
                id,
                name,
                lastModified: Date.now(),
                state: data
            };
            
            const indexStr = localStorage.getItem('agis_sessions_index');
            let index: SessionMetadata[] = indexStr ? JSON.parse(indexStr) : [];
            
            // Preview text generation (safely accessing history)
            const preview = data.conversationHistory 
                ? (data.conversationHistory.substring(0, 100) + '...') 
                : 'No preview';

            index.push({
                id: sessionData.id,
                name: sessionData.name,
                lastModified: sessionData.lastModified,
                preview
            });
            
            localStorage.setItem('agis_sessions_index', JSON.stringify(index));
            localStorage.setItem(`agis_session_${sessionData.id}`, JSON.stringify(sessionData));
            
            return { success: true, id: sessionData.id, message: t.status.sessionSaved };
        } catch (e) {
            console.error(e);
            return { success: false, message: t.status.saveFailed };
        }
    };

    const loadSessionFromStorage = (id: string) => {
         try {
            const sessionStr = localStorage.getItem(`agis_session_${id}`);
            if (!sessionStr) throw new Error("Session not found");
            
            const sessionData = JSON.parse(sessionStr);
            return { success: true, data: sessionData.state, message: t.status.sessionLoaded };
         } catch (e) {
             console.error(e);
             return { success: false, message: t.status.loadFailed };
         }
    };

    const deleteSessionFromStorage = (id: string) => {
        try {
            localStorage.removeItem(`agis_session_${id}`);
            const indexStr = localStorage.getItem('agis_sessions_index');
            if (indexStr) {
                let index: SessionMetadata[] = JSON.parse(indexStr);
                index = index.filter(s => s.id !== id);
                localStorage.setItem('agis_sessions_index', JSON.stringify(index));
            }
            return { success: true, message: t.status.sessionDeleted };
        } catch (e) {
            console.error(e);
            return { success: false, message: t.status.deleteFailed };
        }
    };

    return {
        saveSessionToStorage,
        loadSessionFromStorage,
        deleteSessionFromStorage
    };
};